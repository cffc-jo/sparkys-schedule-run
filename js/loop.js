// requestAnimationFrame loop with a fixed-timestep accumulator.
// update(step) always receives the same step, so physics is identical at 60Hz, 120Hz or when
// throttled. render(alpha, frameDt) gets the leftover fraction for optional interpolation.
// timeScale() (optional) speeds up / slows down game time: used by the debug speed slider.
export function createLoop({ step, maxFrameTime, update, render, timeScale = () => 1 }) {
  let acc = 0;
  let last = -1;
  let raf = 0;
  let running = false;

  function frame(t) {
    raf = requestAnimationFrame(frame);
    const now = t / 1000;
    let dt = last < 0 ? 0 : now - last;
    last = now;
    if (dt > maxFrameTime) dt = maxFrameTime;
    if (dt < 0) dt = 0;
    acc += dt * timeScale();
    while (acc >= step) {
      update(step);
      acc -= step;
    }
    render(acc / step, dt);
  }

  return {
    start() {
      if (running) return;
      running = true;
      last = -1;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    // Forget elapsed time (e.g. after the tab was hidden) so nothing jumps.
    resetClock() {
      last = -1;
      acc = 0;
    },
    get running() { return running; },
  };
}
