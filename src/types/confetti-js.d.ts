declare module 'confetti-js' {
  interface ConfettiSettings {
    target?: string;
    max?: number;
    size?: number;
    animate?: boolean;
    props?: string[];
    colors?: number[][];
    clock?: number;
    rotate?: boolean;
    width?: number;
    height?: number;
    start_from_edge?: boolean;
    respawn?: boolean;
  }

  export default class ConfettiGenerator {
    constructor(settings: ConfettiSettings);
    render(): void;
    clear(): void;
  }
} 