'use strict'
const {
  Worker, isMainThread, MessageChannel
} = require('worker_threads')

// FixedThreadPool , TrampolineThreadPool
/**
 * A thread pool with a static number of threads , is possible to execute tasks in sync or async mode as you prefer
 * @author Alessandro Pio Ardizio
 * @since 0.0.1
 */
class FixedThreadPool {
  /**
     *
     * @param {Number} numThreads  Num of threads for this worker pool
     * @param {Object} an object with possible options for example maxConcurrency
     */
  constructor (numThreads, task, opts) {
    if (!isMainThread) {
      throw new Error('Cannot start a thread pool from a worker thread !!!')
    }
    this.numThreads = numThreads
    this.workers = []
    this.task = task
    this.nextWorker = 0
    for (let i = 1; i <= numThreads; i++) {
      const worker = new Worker(__filename)
      this.workers.push(worker)
      const { port1 } = new MessageChannel()
      worker.emitter = port1
    }
  }

  /**
   *
   * @param {Function} task , a function to execute
   * @param {Any} the input for the task specified
   */
  execute (task, data) {
    // TODO select a worker
    // configure worker to handle message with the specified task
    const worker = this._chooseWorker()
    const id = generateID()
    const res = this._execute(worker, task, id)
    worker.emitter.emit(id, data)
    return res
  }

  _execute (worker, task, id) {
    return new Promise((resolve, reject) => {
      console.log('Executing a task on worker thread ' + worker.threadId)
      worker.emitter.once(id, (data) => {
        console.log('Receivd a message')
        try {
          resolve(task(data))
        } catch (e) {
          reject(e)
        }
      })
    })
  }

  _chooseWorker () {
    console.log(this.workers.length -1)
    console.log(this.nextWorker)
    if ((this.workers.length - 1) === this.nextWorker) {
      console.log('we are here')
      this.nextWorker = 0
      return this.workers[this.nextWorker]
    } else {
      this.nextWorker++
      return this.workers[this.nextWorker]
    }
  }
}

/**
 * Return an id to be associated to a node.
 */
const generateID = () => {
  return Math.random()
    .toString(36)
    .substring(7)
}

module.exports = FixedThreadPool