/* eslint no-use-before-define: 0 */
<template>
  <div class="menus">
    <b-container class="button-wrap">
      <router-link to="/network">
        <b-button class="menu-button" variant="outline-primary">Network Graph</b-button>
      </router-link>
      <router-link to="/orderMap">
        <b-button class="menu-button" variant="outline-primary">Order Map</b-button>
      </router-link>
    </b-container>
  </div>
</template>

<script>
export default {
  created () {
    this.$http.get('/api/movies')
      .then((response) => {
        this.movies = response.data
      })
  },
  data () {
    return {
      movies: []
    }
  }
}
</script>

<style scoped>
  html, body {
    width: 100%;
    height: 100%;
    overflow:hidden;
  }
  .button-wrap {
    padding: 10px;
  }
  .menu-button {
    margin: 50px;
    height: 200px;
    width: 400px;
    font-size: xx-large;
  }
</style>
