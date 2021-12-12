<template>
    <div>
      <a v-if="state==='LOADING'"><slot name="loading">Loading...</slot></a>
      <a @click="pause" v-if="state==='PLAYING'"><slot name="playing">Playing</slot></a>
      <a @click="start" v-if="state==='PAUSED'"><slot name="paused">Paused</slot></a>
      <canvas :ref="canvasId" :width="canvasWidth" :height="canvasHeight"></canvas>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

type State = 'LOADING' | 'PLAYING' | 'PAUSED'

const State: { [k: string]: State } = {
  LOADING: 'LOADING',
  PLAYING: 'PLAYING', 
  PAUSED: 'PAUSED'
}


@Component({
  name: 'audio-wave-form'
})
class AudioWaveForm extends Vue {
  @Prop({ required: true }) eid!: string
  @Prop({ default: '#333333' }) colorNotPlayed!: string
  @Prop({ default: '#9999aa' }) colorPlayed!: string
  @Prop({ default: '#aaaaff' }) backGround!: string
  @Prop({ default: 900 }) canvasWidth!: number
  @Prop({ default: 300 }) canvasHeight!: number
  @Prop ({ required: true }) audioFile!: string
  @Prop({ required: true }) requester!: (file: string) => Promise<ArrayBuffer>

  _canvas!: HTMLCanvasElement
  _context!: CanvasRenderingContext2D
  _audioContext!: AudioContext
  _source!: AudioBufferSourceNode
  _peaks: number[][] = []
  _startTime = 0
  state: State = State.LOADING

  get audioId () {
    return this.eid + 'Audio'
  }

  get canvasId () {
    return this.eid + 'Canvas'
  }

  async mounted () {
    this._canvas = (this.$refs[this.canvasId]) as HTMLCanvasElement
    this._context = this._canvas.getContext("2d") as CanvasRenderingContext2D
    this._context.lineWidth = 1.0
    const rawAudio = await this.requester(this.audioFile)
    this._audioContext = new AudioContext()
    this._source = this._audioContext.createBufferSource();
    const buffer = await this._audioContext.decodeAudioData(rawAudio)
    var audioDestinationNode = this._audioContext.destination;
    this._source.connect(audioDestinationNode)
    this._peaks = this.createPeaks(buffer)
    this._context.beginPath()
    this._context.fillStyle = this.backGround
    this._context.fillRect(0, 0, this.canvasWidth, this.canvasHeight)
    this.drawPeaks(0)
    this._source.buffer = buffer
    this.state = State.PAUSED
  }

  createPeaks (buffer: AudioBuffer) {
    // Float32の波形データのある時点での最小値と最大値(=両者の差が振幅)
    // 上記をチャンネル毎にpeakを保持する
    const multiChannelPeaks: number[][][] = []
    // canvasの横1ピクセルの描画のために読み込むバッファの量
    const chunkSize = Math.ceil(buffer.length / this.canvasWidth)
    for (var i = 0; i < buffer.numberOfChannels; i++) {
      const data = buffer.getChannelData(i)
      const _peaks: number[][] = []
      for (var j = 0; j < this.canvasWidth; j++) {
        const start = j * chunkSize
        const end = start + chunkSize
        const tmp = data.slice(start, end)
        var min = 0 // 最小値
        var max = 0 // 最大値
        for (var c = 0; c < tmp.length; c++) {
          const a = tmp[c]
          min = Math.min(a, min)
          max = Math.max(a, max)
        }
        _peaks.push([min, max])
      }
      multiChannelPeaks.push(_peaks)
    }
    // 複数のチャンネルをマージ
    const peaks = multiChannelPeaks.reduce((a, b) => {
      const _peaks: number[][] = []
      for (var i = 0; i < a.length; i++) {
        _peaks.push([Math.min(a[i][0], b[i][0]), Math.max(a[i][1], b[i][1])])
      }
      return _peaks
    })
    return peaks
  }

  drawPeaks (start: number) {
    this._context.strokeStyle = this.colorNotPlayed
    this._context.beginPath()
    var pos = start
    for (var i = 0; i < this._peaks.length; i++) {
      const min = this._peaks[i][0]
      const max = this._peaks[i][1]
      // Float32のデータ(-1 < d < 1)をCanvas内部の一に変換する
      // Canvasの高さの1/2をhとし、h * min + hで下限、h * max + hで上限が求まる
      const h = this.canvasHeight / 2
      const top = h * max + h
      const bottom = h * min + h
      this._context.moveTo(pos, bottom)
      this._context.lineTo(pos, top)
      pos++
    }
    this._context.stroke()
  }

  mainLoop () {
    if (this.state !== State.PLAYING) {
      return
    }
    // 現在の再生時刻
    const time = this._audioContext.currentTime - this._startTime
    if (this._source.buffer === null) {
      return
    }
    // 再生したサンプル数=時間*サンプリングレート
    const playedLength = time * this._source.buffer.sampleRate
    const chunkSize = Math.ceil(this._source.buffer.length / this.canvasWidth)
    const playedSize = playedLength / chunkSize
    this._context.strokeStyle = this.colorPlayed
    this._context.beginPath()
    var pos = 0
    for (var i = 0; i < playedSize; i++) {
      const min = this._peaks[i][0]
      const max = this._peaks[i][1]
      const h = this.canvasHeight / 2
      const top = h * max + h
      const bottom = h * min + h
      this._context.moveTo(pos, bottom)
      this._context.lineTo(pos, top)
      pos++
    }
    this._context.stroke()
    requestAnimationFrame(this.mainLoop)
  }

  start () {
    this._startTime = this._audioContext.currentTime
    this._source.start()
    this.state = State.PLAYING
    requestAnimationFrame(this.mainLoop)
  }

  pause () {
    this._source.stop(0)
    this.state = State.PAUSED
  }
}
export default AudioWaveForm
</script>