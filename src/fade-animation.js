// Fade Animation Module for Foundry VTT v13

// log message at init
Hooks.once('init', () => {
    console.log('Fade Animation | Initializing module');
});

// once app ready create class
Hooks.once('ready', () => {
    console.log('Fade Animation | Module ready');
    // defines fadeAnimation class
    class FadeAnimation {
        static ID = 'fade-animation';
        // async function to create a div overlay element with black background
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
            // append overlay to document
            document.body.appendChild(overlay);
            
            // Hide loading notifications
            const hideLoadingNotification = () => {
                const loadingBar = document.getElementById('loading');
                const loadingOverlay = document.querySelector('#loading-bar, .loading-bar, .scene-loading, [data-tooltip="Loading..."]');
                if (loadingBar) loadingBar.style.display = 'none';
                if (loadingOverlay) loadingOverlay.style.display = 'none';
            };
            
            const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            
            try {
                overlay.offsetHeight;
                hideLoadingNotification();
                
                // Phase 1: Fade in (1 second)
                overlay.style.opacity = '1';
                await wait(1000);
                
                // Phase 2: Wait (1 second)
                await wait(1000);
                
                // Phase 3: Fade out (1 second)
                overlay.style.opacity = '0';
                await wait(1000);
                
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
            
            if (connectedPlayers.length > 0) {
                ui.notifications.info(`Instant fade animation sent to ${connectedPlayers.length} player(s)`);
            } else {
                ui.notifications.info("No players connected");
            }
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
    
    ui.notifications.info("Fade Animation module loaded successfully");
    console.log('Fade Animation | Module fully loaded and ready');
});