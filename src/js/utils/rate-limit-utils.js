/**
 * Rate limiting utility
 */
export class RateLimit {
    constructor(options = {}) {
      this.lastAction = 0;
      this.minInterval = options.interval || 3000;
      this.message = options.message || 'Please wait {time} seconds';
    }
  
    check() {
      const now = Date.now();
      const timeLeft = this.minInterval - (now - this.lastAction);
  
      if (timeLeft > 0) {
        return {
          allowed: false,
          message: this.message.replace('{time}', Math.ceil(timeLeft / 1000)),
          waitTime: timeLeft
        };
      }
  
      this.lastAction = now;
      return { allowed: true };
    }
  
    reset() {
      this.lastAction = 0;
    }
  }