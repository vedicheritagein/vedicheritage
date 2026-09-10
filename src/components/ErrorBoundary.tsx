import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Keeps a render error from blanking the whole page.
 *
 * Without this, one thrown error anywhere in the tree leaves the visitor on a
 * white screen with no way forward - on a page whose job is taking bookings, the
 * fallback needs to still show how to reach the temple.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Swap in a real reporter (Sentry et al.) when one is available.
    console.error('Unhandled render error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-white"
      >
        <h1 className="font-['Alga','Bodoni_Moda','Playfair_Display',Georgia,serif] text-2xl sm:text-3xl font-normal text-[#2F2A24]">
          Something went wrong
        </h1>
        <p className="font-['Outfit',sans-serif] text-sm text-[#7A736C] max-w-md">
          Please reload the page. If the problem continues, you can still reach us
          for tickets and sponsorship:
        </p>
        <div className="font-['Outfit',sans-serif] text-sm text-[#2F2A24] space-y-1">
          <p>
            <a href="tel:+16318059105" className="font-bold hover:text-[#F07B00]">
              +1 631-805-9105
            </a>
          </p>
          <p>
            <a
              href="mailto:vedic.heritageinc@gmail.com"
              className="font-bold hover:text-[#F07B00]"
            >
              vedic.heritageinc@gmail.com
            </a>
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 bg-[#ED7E00] hover:bg-[#D96B00] text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-[14px] cursor-pointer transition-colors"
        >
          Reload page
        </button>
      </div>
    );
  }
}
