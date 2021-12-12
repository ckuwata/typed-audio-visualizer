<template>
  <div id="app">
    <div v-if="loaded">
      <audio-wave-form :eid="_eid" :audioFile="_audioFile" :requester="_requester" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { AudioWaveForm } from 'typed-audio-visualizer'
import axios from 'axios'

@Component({
  components: {
    AudioWaveForm,
  },
})
export default class App extends Vue {
  _eid!: string
  _audioFile!: string
  _controls!: string
  _requester!: (file: string) => Promise<ArrayBuffer>
  loaded = false
  created () {
    this._eid = 'sample'
    const client = axios
    this._audioFile = '/sample.mp3'
    this._requester = async (f: string) => {
      const r = await client.get(f, {
        responseType: 'arraybuffer'
      })
      if (r.status !== 200) {
        throw new Error(`error: ${r.status}`)
      }
      return r.data
    }
    this.loaded = true
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
