export const ICS201_TIER1_IDLE_MS = 800
export const ICS201_TIER1_MAX_WAIT_MS = 1500
export const ICS201_TIER2_CHECKPOINT_PAUSE_MS = 60_000
export const ICS201_CRDT_PERSIST_MS = 1500

export type Ics201AutosaveSchedulerOptions = {
  idleMs?: number
  maxWaitMs?: number
  checkpointPauseMs?: number
  onTier1: () => void | Promise<void>
  onTier2Checkpoint: () => void | Promise<void>
}

export class Ics201AutosaveScheduler {
  private idleMs: number
  private maxWaitMs: number
  private checkpointPauseMs: number
  private onTier1: () => void | Promise<void>
  private onTier2Checkpoint: () => void | Promise<void>
  private idleTimer: number | null = null
  private maxWaitTimer: number | null = null
  private checkpointTimer: number | null = null
  private dirty = false
  private tier1InFlight = false
  private tier1Queued = false

  constructor(options: Ics201AutosaveSchedulerOptions) {
    this.idleMs = options.idleMs ?? ICS201_TIER1_IDLE_MS
    this.maxWaitMs = options.maxWaitMs ?? ICS201_TIER1_MAX_WAIT_MS
    this.checkpointPauseMs = options.checkpointPauseMs ?? ICS201_TIER2_CHECKPOINT_PAUSE_MS
    this.onTier1 = options.onTier1
    this.onTier2Checkpoint = options.onTier2Checkpoint
  }

  markDirty() {
    this.dirty = true
    this.scheduleTier1()
    this.scheduleCheckpoint()
  }

  async flushNow() {
    this.clearTier1Timers()
    await this.runTier1()
  }

  onSectionBlur() {
    void this.flushNow().then(() => {
      if (this.dirty) {
        void this.onTier2Checkpoint()
        this.dirty = false
      }
    })
  }

  destroy() {
    this.clearTier1Timers()
    if (this.checkpointTimer !== null) {
      globalThis.clearTimeout(this.checkpointTimer)
      this.checkpointTimer = null
    }
  }

  private scheduleTier1() {
    if (this.idleTimer !== null) {
      globalThis.clearTimeout(this.idleTimer)
    }
    this.idleTimer = globalThis.setTimeout(() => {
      this.idleTimer = null
      void this.runTier1()
    }, this.idleMs) as unknown as number

    if (this.maxWaitTimer === null) {
      this.maxWaitTimer = globalThis.setTimeout(() => {
        this.maxWaitTimer = null
        void this.runTier1()
      }, this.maxWaitMs) as unknown as number
    }
  }

  private scheduleCheckpoint() {
    if (this.checkpointTimer !== null) {
      globalThis.clearTimeout(this.checkpointTimer)
    }
    this.checkpointTimer = globalThis.setTimeout(() => {
      this.checkpointTimer = null
      if (!this.dirty) return
      void this.onTier2Checkpoint()
      this.dirty = false
    }, this.checkpointPauseMs) as unknown as number
  }

  private clearTier1Timers() {
    if (this.idleTimer !== null) {
      globalThis.clearTimeout(this.idleTimer)
      this.idleTimer = null
    }
    if (this.maxWaitTimer !== null) {
      globalThis.clearTimeout(this.maxWaitTimer)
      this.maxWaitTimer = null
    }
  }

  private async runTier1() {
    this.clearTier1Timers()
    if (this.tier1InFlight) {
      this.tier1Queued = true
      return
    }
    this.tier1InFlight = true
    try {
      await this.onTier1()
    } finally {
      this.tier1InFlight = false
      if (this.tier1Queued) {
        this.tier1Queued = false
        void this.runTier1()
      }
    }
  }
}
