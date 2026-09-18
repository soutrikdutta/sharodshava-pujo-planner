import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Sharodshav:', error, errorInfo);
  }

  private handleReload = () => {
    try {
      localStorage.removeItem('pujo_planner_auth_user');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#08090d] text-white flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#0e1017] border border-[#d4af37]/30 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-[#d4af37]/40 flex items-center justify-center mx-auto mb-4 text-[#d4af37]">
              <AlertCircle size={28} />
            </div>
            
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f4e5a9] via-[#d4af37] to-[#e6ca65] mb-2 font-sans">
              SHARODSHAV
            </h2>
            
            <p className="text-sm text-white/80 mb-6">
              A temporary display glitch occurred. Tap below to refresh the festival portal.
            </p>

            <button
              onClick={this.handleReload}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#d4af37] to-[#e6ca65] text-black font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 mx-auto hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)] cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Reload Sharodshav</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
