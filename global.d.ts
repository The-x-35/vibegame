declare module 'solana-agent-kit';
declare module '@pump-fun/pump-sdk';
declare module 'pinata'; 

// Allow importing browser-served .mjs modules from /public
declare module '/wifegame/modules/*';

declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': any;
  }
}