
import { Howl } from 'howler';

// Gentle LullaByte heartbeat sounds
const ping = new Howl({ 
  src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEYASKc0fbOdSsEJHjB7+GQQQK'], 
  volume: 0.3 
});

const tap = new Howl({ 
  src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEYASKc0fbOdSsEJHjB7+GQQQK'], 
  volume: 0.1 
});

const error = new Howl({ 
  src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEYASKc0fbOdSsEJHjB7+GQQQK'], 
  volume: 0.2 
});

let heartbeatInterval: NodeJS.Timeout | null = null;
let isMonitoring = false;

export const playPing = () => {
  console.log('🍯 LullaByte found profit - gentle ping!');
  ping.play();
};

export const playError = () => {
  console.log('🍯 LullaByte needs attention - soft buzz');
  error.play();
};

export const startHeartbeat = () => {
  if (heartbeatInterval || isMonitoring) return;
  
  isMonitoring = true;
  console.log('🍯 Starting LullaByte heartbeat monitor...');
  
  heartbeatInterval = setInterval(() => {
    tap.play();
    console.log('💓 LullaByte heartbeat - all systems gentle');
  }, 3000);
};

export const stopHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  isMonitoring = false;
  console.log('🍯 LullaByte heartbeat monitor stopped');
};

export const isHeartbeatActive = () => isMonitoring;

// Auto-recovery for network drops
export const checkAndResumeHeartbeat = () => {
  if (isMonitoring && !heartbeatInterval) {
    console.log('🍯 Resuming LullaByte heartbeat after interruption...');
    startHeartbeat();
  }
};
