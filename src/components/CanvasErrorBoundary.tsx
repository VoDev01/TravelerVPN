import React from "react";

interface Props {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

interface State {
	hasError: boolean;
}

/**
 * Isolates failures from the globally mounted 3D globe. Because the canvas is
 * rendered as a sibling of the root <Stack>, an uncaught render/GL error would
 * otherwise reach expo-router's own error boundary and force the router (and its
 * NavigationContainer) to remount, producing a "nested NavigationContainer"
 * crash. Keeping the failure inside this boundary prevents that.
 */
export class CanvasErrorBoundary extends React.Component<Props, State> {
	state: State = { hasError: false };

	static getDerivedStateFromError(): State {
		return { hasError: true };
	}

	componentDidCatch(error: unknown) {
		console.error("InteractiveServerMap failed to render:", error);
	}

	render() {
		if (this.state.hasError) {
			return this.props.fallback ?? null;
		}
		return this.props.children;
	}
}
