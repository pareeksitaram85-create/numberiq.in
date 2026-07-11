// Circuit Breaker implementation for external API dependencies
// Standard states: CLOSED, OPEN, HALF_OPEN

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export class CircuitBreaker {
  private name: string;
  private failureThreshold: number;
  private cooldownPeriodMs: number;
  private successThreshold: number;

  private state: CircuitState = "CLOSED";
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastStateChange: number = Date.now();
  private nextAttemptAllowed: number = 0;

  constructor(
    name: string,
    options: {
      failureThreshold?: number;
      cooldownPeriodMs?: number;
      successThreshold?: number;
    } = {}
  ) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5;
    this.cooldownPeriodMs = options.cooldownPeriodMs || 30000; // default 30 seconds
    this.successThreshold = options.successThreshold || 3;
  }

  public getState(): CircuitState {
    this.checkCooldown();
    return this.state;
  }

  private checkCooldown() {
    if (this.state === "OPEN" && Date.now() > this.nextAttemptAllowed) {
      this.setState("HALF_OPEN");
    }
  }

  private setState(state: CircuitState) {
    this.state = state;
    this.lastStateChange = Date.now();
    console.log(`[CircuitBreaker: ${this.name}] state changed to ${state}`);
    
    if (state === "OPEN") {
      this.nextAttemptAllowed = Date.now() + this.cooldownPeriodMs;
    } else if (state === "CLOSED") {
      this.failureCount = 0;
      this.successCount = 0;
    } else if (state === "HALF_OPEN") {
      this.successCount = 0;
    }
  }

  public execute<T>(action: () => Promise<T>): Promise<T> {
    this.checkCooldown();

    if (this.state === "OPEN") {
      return Promise.reject(
        new Error(`Circuit breaker '${this.name}' is OPEN. Requests are temporarily blocked.`)
      );
    }

    return action()
      .then((result) => {
        this.onSuccess();
        return result;
      })
      .catch((error) => {
        this.onFailure();
        throw error;
      });
  }

  private onSuccess() {
    if (this.state === "HALF_OPEN") {
      this.successCount += 1;
      if (this.successCount >= this.successThreshold) {
        this.setState("CLOSED");
      }
    } else if (this.state === "CLOSED") {
      this.failureCount = 0;
    }
  }

  private onFailure() {
    this.failureCount += 1;
    if (this.state === "CLOSED" && this.failureCount >= this.failureThreshold) {
      this.setState("OPEN");
    } else if (this.state === "HALF_OPEN") {
      this.setState("OPEN");
    }
  }
}

// Global registry to persist breaker instances across HMR reload cycles in Next.js development
const globalBreakers = globalThis as unknown as {
  _circuitBreakers?: Record<string, CircuitBreaker>;
};

if (!globalBreakers._circuitBreakers) {
  globalBreakers._circuitBreakers = {};
}

export function getCircuitBreaker(name: string, options?: any): CircuitBreaker {
  if (!globalBreakers._circuitBreakers![name]) {
    globalBreakers._circuitBreakers![name] = new CircuitBreaker(name, options);
  }
  return globalBreakers._circuitBreakers![name];
}
