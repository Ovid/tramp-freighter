import { useEffect, useRef } from 'react';
import * as THREE from '../../../vendor/three/build/three.module.js';
import { initScene, onWindowResize } from '../../game/engine/scene';
import { JumpAnimationSystem } from '../../game/engine/game-animation';
import { useGameState } from '../../context/GameContext';

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
export function StarMapCanvas() {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const gameStateManager = useGameState();

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

            if (clickedStar && window.selectStarById) {
              window.selectStarById(clickedStar.data.id);
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
      };

      // Animation loop - runs outside React render cycle
      function animate() {
        animationFrameId = requestAnimationFrame(animate);

        // Update controls (damping)
        controls.update();

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

  return (
    <div
      ref={containerRef}
      className="starmap-container"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  );
}
