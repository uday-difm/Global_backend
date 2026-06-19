import { EventEmitter } from "events";

class ApplicationEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }
}

export const EventBus = new ApplicationEventBus();
