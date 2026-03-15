import {
  useEffect,
  useRef,
  useState,
  useCallback,
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
import { VISUAL_CONFIG, EVENT_NAMES } from '../../game/constants';
import { useGame } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useStarData } from '../../hooks/useStarData';
import { CameraControls } from './CameraControls';
import { prefersReducedMotion } from '../../game/utils/reduced-motion';

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
  const game = useGame();
  const starData = useStarData();
  const [autoRotationEnabled, setAutoRotationEnabled] = useState(
    () => !prefersReducedMotion()
  );
  const autoRotationRef = useRef(autoRotationEnabled);
  const [boundaryVisible, setBoundaryVisible] = useState(true);

  // Subscribe to fuel changes to update wormhole connection colors
  const fuel = useGameEvent(EVENT_NAMES.FUEL_CHANGED);
  const currentSystem = useGameEvent(EVENT_NAMES.LOCATION_CHANGED);

  // Starmap interaction methods for context
  const starmapMethods = useRef({
    selectStarById: null,
    deselectStar: null,
  });

  // Expose imperative methods to parent component
  useImperativeHandle(
    ref,
    () => ({
      selectStarById: (systemId) => {
        if (starmapMethods.current.selectStarById) {
          starmapMethods.current.selectStarById(systemId);
        }
      },
      deselectStar: () => {
        if (starmapMethods.current.deselectStar) {
          starmapMethods.current.deselectStar();
        }
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
      updateConnectionColors(game);
    }
  }, [fuel, currentSystem, game]);

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
    const container = containerRef.current;

    let scene,
      camera,
      renderer,
      controls,
      lights,
      animationFrameId,
      animationSystem;

    // Check once at init time — user can still toggle auto-rotation manually
    const reducedMotion = prefersReducedMotion();

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
      container.appendChild(renderer.domElement);

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
        starData
      );

      // Register animation system with GameCoordinator for useAnimationLock hook
      game.setAnimationSystem(animationSystem);

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

      // Set up starmap interaction methods for context
      const selectStarById = (systemId) => {
        const star = stars.find((s) => s.data.id === systemId);
        if (star) {
          selectStar(star, scene, camera);
          if (props.onSystemSelected) {
            props.onSystemSelected(systemId);
          }
        }
      };

      const deselectStarMethod = () => {
        deselectStar();
        if (props.onSystemDeselected) {
          props.onSystemDeselected();
        }
      };

      // Update ref methods for imperative handle and context
      starmapMethods.current = {
        selectStarById,
        deselectStar: deselectStarMethod,
      };

      // Notify parent that starmap methods are ready
      if (props.onStarmapMethodsReady) {
        props.onStarmapMethodsReady({
          selectStarById,
          deselectStar: deselectStarMethod,
        });
      }

      // Initialize current system indicator
      updateCurrentSystemIndicator(scene, camera, stars, currentSystem);

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

        // Update selection ring animations (static in reduced-motion mode)
        updateSelectionRingAnimations(currentTime, reducedMotion);

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

        // Clear animation system reference from GameCoordinator
        game.setAnimationSystem(null);

        // Dispose of Three.js resources
        if (renderer) {
          // Remove renderer DOM element
          if (
            container &&
            renderer.domElement &&
            container.contains(renderer.domElement)
          ) {
            container.removeChild(renderer.domElement);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Three.js scene initializes once per mount
  }, []);

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
    setAutoRotationEnabled((prev) => !prev);
  };

  const handleToggleBoundary = () => {
    if (sceneRef.current) {
      const newVisibility = toggleBoundary(sceneRef.current.sectorBoundary);
      setBoundaryVisible(newVisibility);
    }
  };

  // Keyboard camera controls: arrow keys rotate, +/- zoom
  const handleKeyDown = useCallback((event) => {
    if (!sceneRef.current) return;
    const { camera, controls } = sceneRef.current;

    const step = VISUAL_CONFIG.keyboardRotationStep * (Math.PI / 180);

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown': {
        event.preventDefault();
        const offset = new THREE.Vector3().subVectors(
          camera.position,
          controls.target
        );
        const spherical = new THREE.Spherical().setFromVector3(offset);

        if (event.key === 'ArrowLeft') {
          spherical.theta -= step;
        } else if (event.key === 'ArrowRight') {
          spherical.theta += step;
        } else if (event.key === 'ArrowUp') {
          spherical.phi = Math.max(0.1, spherical.phi - step);
        } else if (event.key === 'ArrowDown') {
          spherical.phi = Math.min(Math.PI - 0.1, spherical.phi + step);
        }

        offset.setFromSpherical(spherical);
        camera.position.copy(controls.target).add(offset);
        controls.update();
        break;
      }
      case '+':
      case '=':
        event.preventDefault();
        zoomIn(camera, controls);
        break;
      case '-':
      case '_':
        event.preventDefault();
        zoomOut(camera, controls);
        break;
    }
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className="starmap-container"
        tabIndex={0}
        role="application"
        aria-label="3D Star Map — use arrow keys to rotate, plus and minus to zoom"
        onKeyDown={handleKeyDown}
      />
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
