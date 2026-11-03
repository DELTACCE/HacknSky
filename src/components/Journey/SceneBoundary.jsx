import { Component } from 'react';

/** Catches a failed Scene chunk load/render so the readable fallback layout still works. */
export default class SceneBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.warn('Visual journey unavailable; showing all chapters.', error);
    this.props.onFail?.();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
