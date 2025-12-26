import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import * as THREE from 'three';
import {
  initScene,
  onWindowResize,
  zoomIn,
  zoomOut,
  toggleBoundary,
} from '../../game/engine/scene';
import { updateConnectionColors } from '../../game/engine/wormholes';
import { JumpAnimationSystem } from '../../game/engine/game-animation';
import {
  selectStar,
  deselectStar,
  getSelectedStar,
  updateCurrentSystemIndicator,
  getCurrentSystemIndicator,
  updateSelectionRingAnimations,
} from '../../game/engine/interaction';
import { updateLabelScale } from '../../game/engine/stars';
import { VISUAL_CONFIG } from '../../game/constants';
import { useGameState } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { CameraControls } from './CameraControls';

/**
 * StarMapCanvas component wraps the Three.js starmap rendering.
 *
 * This component initializes the Three.js scene once on mount and properly
 * cleans up resources on unmount. The scene initialization happens in a
 * useEffect with an empty dependency array to ensure it only runs once.
 *
 * CRITICAL: The Three.js scene must initialize only once per mount.
 * Re-initialization on re-render would cause performance issues and memory leaks.
 *
 * React Migration Spec: Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 31.1, 31.2, 31.3, 31.4, 31.5, 43.1, 43.2
 */
export const StarMapCanvas = forwardRef(function StarMapCanvas(props, ref) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const gameStateManager = useGameState();
  const [autoRotationEnabled, setAutoRotationEnabled] = useState(true);
  const autoRotationRef = useRef(autoRotationEnabled);
  const [boundaryVisible, setBoundaryVisible] = useState(true);

  // Subscribe to fuel changes to update wormhole connection colors
  const fuel = useGameEvent('fuelChanged');
  const currentSystem = useGameEvent('locationChanged');

  // Expose imperative methods to parent component
  useImperativeHandle(
    ref,
    () => ({
      selectStarById: (systemId) => {
        if (sceneRef.current && sceneRef.current.stars) {
          const star = sceneRef.current.stars.find(
            (s) => s.data.id === systemId
          );
          if (star) {
            selectStar(star, sceneRef.current.scene, sceneRef.current.camera);
          }
        }
      },
      deselectStar: () => {
        deselectStar();
      },
    }),
    []
  );

  // Keep ref in sync with state
  useEffect(() => {
    autoRotationRef.current = autoRotationEnabled;
  }, [autoRotationEnabled]);

  // Update wormhole connection colors when fuel or system changes
  useEffect(() => {
    if (sceneRef.current) {
      updateConnectionColors(gameStateManager);
    }
  }, [fuel, currentSystem, gameStateManager]);

  // Update current system indicator when system changes
  useEffect(() => {
    if (sceneRef.current && sceneRef.current.stars) {
      updateCurrentSystemIndicator(
        sceneRef.current.scene,
        sceneRef.current.camera,
        sceneRef.current.stars,
        currentSystem
      );
    }
  }, [currentSystem]);

  useEffect(() => {
    // Guard: Don't initialize if container not ready or already initialized
    if (!containerRef.current || sceneRef.current) {
      return;
    }

    let scene,
      camera,
      renderer,
      controls,
      lights,
      animationFrameId,
      animationSystem;

    try {
      // Initialize Three.js scene once
      const sceneComponents = initScene();
      scene = sceneComponents.scene;
      camera = sceneComponents.camera;
      renderer = sceneComponents.renderer;
      controls = sceneComponents.controls;
      lights = sceneComponents.lights;
      const stars = sceneComponents.stars;

      // Append renderer to container
      containerRef.current.appendChild(renderer.domElement);

      // Set up raycaster for star selection (only if stars exist)
      let handleCanvasClick = null;
      if (stars && stars.length > 0) {
        const raycaster = new THREE.Raycaster();
        const mouse = { x: 0, y: 0 };

        // Build clickable objects array
        const clickableObjects = [];
        stars.forEach((star) => {
          if (star.sprite) {
            clickableObjects.push(star.sprite);
          }
          if (star.label) {
            clickableObjects.push(star.label);
          }
        });

        // Handle star clicks
        handleCanvasClick = (event) => {
          // Convert to normalized device coordinates
          mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
          mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(
            clickableObjects,
            false
          );

          if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            const clickedStar = stars.find(
              (star) =>
                star.sprite === clickedObject || star.label === clickedObject
            );

            if (clickedStar) {
              // Select star visually and notify parent via callback
              selectStar(clickedStar, scene, camera);
              if (props.onSystemSelected) {
                props.onSystemSelected(clickedStar.data.id);
              }
            }
          } else {
            // Clicked empty space - deselect
            deselectStar();
            // Close system panel when clicking empty space
            if (props.onSystemDeselected) {
              props.onSystemDeselected();
            }
          }
        };

        renderer.domElement.addEventListener('click', handleCanvasClick);
      }

      // Initialize animation system
      animationSystem = new JumpAnimationSystem(
        scene,
        camera,
        controls,
        gameStateManager.starData
      );

      // Register animation system with GameStateManager for useAnimationLock hook
      gameStateManager.setAnimationSystem(animationSystem);

      // Store scene components for cleanup
      sceneRef.current = {
        scene,
        camera,
        renderer,
        controls,
        lights,
        animationSystem,
        sectorBoundary: sceneComponents.sectorBoundary,
        stars,
      };

      // Initialize current system indicator
      updateCurrentSystemIndicator(
        scene,
        camera,
        stars,
        gameStateManager.state.player.currentSystem
      );

      // Temp vector for auto-rotation (reused to avoid allocation)
      const _tempOffset = new THREE.Vector3();

      // Animation loop - runs outside React render cycle
      function animate() {
        animationFrameId = requestAnimationFrame(animate);

        // Get current time for animations
        const currentTime = Date.now() / 1000;

        // Update auto-rotation if enabled (use ref to avoid stale closure)
        if (autoRotationRef.current && controls && controls.target) {
          // Convert degrees per frame to radians
          const rotationSpeed =
            VISUAL_CONFIG.autoRotationSpeed * (Math.PI / 180);

          // Get current camera position relative to target
          _tempOffset.copy(camera.position).sub(controls.target);

          // Apply rotation around Y-axis (vertical axis)
          const cosAngle = Math.cos(rotationSpeed);
          const sinAngle = Math.sin(rotationSpeed);

          const newX = _tempOffset.x * cosAngle - _tempOffset.z * sinAngle;
          const newZ = _tempOffset.x * sinAngle + _tempOffset.z * cosAngle;

          _tempOffset.x = newX;
          _tempOffset.z = newZ;

          // Update camera position
          camera.position.copy(controls.target).add(_tempOffset);
        }

        // Update label scale and opacity based on camera distance
        updateLabelScale(stars, camera);

        // Update selection ring animations
        updateSelectionRingAnimations(currentTime);

        // Orient selection rings to face camera
        const selectedStar = getSelectedStar();
        if (selectedStar && selectedStar.selectionRing) {
          selectedStar.selectionRing.lookAt(camera.position);
        }

        const currentIndicator = getCurrentSystemIndicator();
        if (currentIndicator) {
          currentIndicator.lookAt(camera.position);
          // Ensure current system indicator is always visible
          if (!currentIndicator.visible) {
            currentIndicator.visible = true;
          }
        }

        // Update controls (damping)
        if (controls) {
          controls.update();
        }

        // Render scene
        renderer.render(scene, camera);
      }

      // Start animation loop
      animate();

      // Handle window resize
      const handleResize = () => {
        onWindowResize(camera, renderer);
      };
      window.addEventListener('resize', handleResize);

      // Cleanup function
      return () => {
        // Cancel animation frame
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }

        // Remove resize listener
        window.removeEventListener('resize', handleResize);

        // Remove click listener
        if (renderer && renderer.domElement && handleCanvasClick) {
          renderer.domElement.removeEventListener('click', handleCanvasClick);
        }

        // Clear animation system reference from GameStateManager
        gameStateManager.setAnimationSystem(null);

        // Dispose of Three.js resources
        if (renderer) {
          // Remove renderer DOM element
          if (
            containerRef.current &&
            renderer.domElement &&
            containerRef.current.contains(renderer.domElement)
          ) {
            containerRef.current.removeChild(renderer.domElement);
          }

          // Dispose renderer
          renderer.dispose();
        }

        // Dispose scene children (geometries, materials, textures)
        if (scene) {
          scene.traverse((object) => {
            if (object.geometry) {
              object.geometry.dispose();
            }
            if (object.material) {
              // Dispose material textures first
              if (Array.isArray(object.material)) {
                object.material.forEach((material) => {
                  if (material.map) material.map.dispose();
                  material.dispose();
                });
              } else {
                if (object.material.map) object.material.map.dispose();
                object.material.dispose();
              }
            }
          });
        }

        // Clear scene reference
        sceneRef.current = null;
      };
    } catch (error) {
      console.error('Failed to initialize Three.js scene:', error);
      // Error will be caught by ErrorBoundary
      throw error;
    }
  }, []); // Empty dependency array - initialize once per mount

  // Camera control handlers
  const handleZoomIn = () => {
    if (sceneRef.current) {
      zoomIn(sceneRef.current.camera, sceneRef.current.controls);
    }
  };

  const handleZoomOut = () => {
    if (sceneRef.current) {
      zoomOut(sceneRef.current.camera, sceneRef.current.controls);
    }
  };

  const handleToggleRotation = () => {
    setAutoRotationEnabled(!autoRotationEnabled);
  };

  const handleToggleBoundary = () => {
    if (sceneRef.current) {
      const newVisibility = toggleBoundary(sceneRef.current.sectorBoundary);
      setBoundaryVisible(newVisibility);
    }
  };

  return (
    <>
      <div ref={containerRef} className="starmap-container" />
      <CameraControls
        cameraState={{ autoRotationEnabled, boundaryVisible }}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onToggleRotation={handleToggleRotation}
        onToggleBoundary={handleToggleBoundary}
      />
    </>
  );
});
