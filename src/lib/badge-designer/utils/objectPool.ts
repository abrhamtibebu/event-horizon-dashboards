/**
 * Object pool for Fabric.js objects to reduce GC pressure
 */
import * as fabric from 'fabric'

interface PoolConfig {
  maxSize: number
  initialSize: number
}

class FabricObjectPool {
  private pools: Map<string, fabric.Object[]> = new Map()
  private config: PoolConfig

  constructor(config: PoolConfig = { maxSize: 50, initialSize: 10 }) {
    this.config = config
  }

  get(type: string, factory: () => fabric.Object): fabric.Object {
    const pool = this.pools.get(type) || []
    
    if (pool.length > 0) {
      const obj = pool.pop()!
      // Reset object state
      obj.set({
        left: 0,
        top: 0,
        angle: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
      })
      return obj
    }
    
    return factory()
  }

  release(type: string, obj: fabric.Object) {
    const pool = this.pools.get(type) || []
    
    if (pool.length < this.config.maxSize) {
      // Clean up object
      obj.set({
        selectable: false,
        evented: false,
      })
      pool.push(obj)
      this.pools.set(type, pool)
    }
  }

  clear() {
    this.pools.clear()
  }
}

export const objectPool = new FabricObjectPool()





