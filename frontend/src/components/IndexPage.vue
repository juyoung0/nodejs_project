/* eslint no-use-before-define: 0 */
<template>
  <div class="menus">
    <b-container class="button-wrap">
      <router-link to="/network">
        <b-button class="menu-button" id="index-button-network" variant="outline-primary">
            Network Graph<br>
            <span> A network in which customers actually interact </span><br>
            <b-button id="into">Enter</b-button>
        </b-button>
      </router-link>
      <router-link to="/orderMap">
        <b-button class="menu-button" id="index-button-map" variant="outline-primary">
            Order Map<br>
            <span> Navigate order locations locally </span><br>
            <b-button id="into">Enter</b-button>
        </b-button>
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
  .menus{
    width: 100%;
    height: 100%;
    position: absolute;
  }
  .button-wrap {
    padding: 0px;
    width: 100%;
    height: 100%;
    float: left;
    max-width: 100%;
  }
  #into{
    background-color: rgba(0,0,0,0.6);
    color: rgba(255,255,255,0.1);
    border-color: rgba(255,255,255,0.1);
    transition: color 2s;
    transition: background-color 1s;
    font-weight: 600;
  }
  .menu-button {
    margin: 0px;
    height: 100%;
    width: 50%;
    font-size: 2.5em;
    float: left;
    border-radius: 0px;
    border-width:0px;
    background-position: center center;
    background-size: cover;
    color: rgba(255,255,255,0.4);
    transition: color 500ms;
  }
  .menu-button span{
    font-size: 0.4em;
    font-weight: 100;
  }
  .menu-button:hover {
    color: rgba(255,255,255,1);
  }
  
  .menu-button:hover #into{
    color: rgba(0,0,0,1);
    background-color: rgba(255,255,255,1);
  }
  #index-button-network{
    background-image: url('../../static/images/network.jpg');
  }
  #index-button-map{
    background-image: url('../../static/images/map.jpg');
  }
</style>
