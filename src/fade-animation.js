// Fade Animation Module for Foundry VTT v13

Hooks.once('init', () => {
    console.log('Fade Animation | Initializing module');
});

Hooks.once('ready', () => {
    console.log('Fade Animation | Module ready');
    
    class FadeAnimation {
        static ID = 'fade-animation';
        
        static async performFade(startTime = null) {
            console.log('Performing fade animation');
            
            const overlay = document.createElement('div');
            overlay.id = 'fade-overlay-' + Date.now();
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background-color: black;
                z-index: 10000;
                opacity: 0;
                pointer-events: none;
                transition: opacity 1s ease-in-out;
            `;
            
            document.body.appendChild(overlay);
            
            // Hide loading notifications - more comprehensive approach
            const hideLoadingNotification = () => {
                // Target multiple possible loading elements
                const selectors = [
                    '#loading',
                    '#loading-bar', 
                    '.loading-bar',
                    '.scene-loading',
                    '[data-tooltip="Loading..."]',
                    '#notifications .notification',
                    '.notification.info',
                    '.notifications-container .notification'
                ];
                
                selectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        if (el && (el.textContent?.includes('Loading') || el.textContent?.includes('loading'))) {
                            el.style.display = 'none';
                            el.style.visibility = 'hidden';
                            el.style.opacity = '0';
                        }
                    });
                });
                
                // Also hide any progress bars
                const progressBars = document.querySelectorAll('progress, .progress, .progress-bar');
                progressBars.forEach(bar => {
                    bar.style.display = 'none';
                    bar.style.visibility = 'hidden';
                });
                
                // Hide Foundry's specific loading overlay if it exists
                const foundryLoading = document.querySelector('#loading, .loading-overlay, .scene-loading-overlay');
                if (foundryLoading) {
                    foundryLoading.style.display = 'none';
                    foundryLoading.style.visibility = 'hidden';
                    foundryLoading.style.opacity = '0';
                }
            };
            
            const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            
            try {
                overlay.offsetHeight;
                
                // Hide loading notifications immediately and continuously
                hideLoadingNotification();
                
                // Set up observer to hide loading notifications that appear during animation
                const observer = new MutationObserver(() => {
                    hideLoadingNotification();
                });
                
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributeFilter: ['style', 'class']
                });
                
                // Phase 1: Fade in (1 second)
                overlay.style.opacity = '1';
                await wait(1000);
                
                // Continue hiding during wait phase
                hideLoadingNotification();
                
                // Phase 2: Wait (1 second)
                await wait(1000);
                
                // Phase 3: Fade out (1 second)
                overlay.style.opacity = '0';
                await wait(1000);
                
                // Stop observing and clean up
                observer.disconnect();
                overlay.remove();
                
            } catch (error) {
                console.error('Fade animation error:', error);
                if (overlay.parentNode) overlay.remove();
            }
        }
        
        static async triggerFadeForAll() {
            console.log('Triggering fade for all players');
            
            if (!game.user.isGM) {
                ui.notifications.warn("Only GMs can trigger fade animations for all players");
                return;
            }
            
            // Get all connected players (excluding GM)
            const connectedPlayers = game.users.filter(u => u.active && !u.isGM);
            
            // Send to players immediately
            if (connectedPlayers.length > 0) {
                game.socket.emit('module.fade-animation', {
                    type: 'TRIGGER_FADE',
                    senderId: game.user.id,
                    timestamp: Date.now()
                });
                
                console.log(`Sent instant fade animation to ${connectedPlayers.length} players`);
            }
            
            // Execute for GM immediately (no await to start instantly)
            this.performFade();
            
        }
    }
    
    // Register socket listener
    game.socket.on('module.fade-animation', (data) => {
        console.log('Socket received by user:', game.user.name, 'Data:', data);
        
        if (data.type === 'TRIGGER_FADE') {
            if (data.senderId === game.user.id) {
                console.log('Ignoring message - sent by current user');
                return;
            }
            
            console.log('Executing instant fade animation for user:', game.user.name);
            
            // Execute immediately (no await)
            FadeAnimation.performFade().then(() => {
                console.log('Instant fade animation completed for user:', game.user.name);
            }).catch(error => {
                console.error('Fade animation failed for user:', game.user.name, error);
            });
        }
    });
    
    // Make available globally
    window.FadeAnimation = FadeAnimation;
    game.fadeAnimation = FadeAnimation;
    
    // Create global function for easy macro use
    window.triggerFadeAnimation = () => {
        FadeAnimation.triggerFadeForAll();
    };
    
    
    console.log('Fade Animation | Module fully loaded and ready');
});