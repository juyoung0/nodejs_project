<template>
  <div id="app">
    <b-navbar toggleable="lg" type="dark" variant="info">
      <router-link to="/">
        <b-navbar-brand href="">ASKHUB Visualization</b-navbar-brand>
      </router-link>
        <b-navbar-nav>
          <router-link tag="li" class="nav-link" to="network">Referral Network</router-link>
          <router-link tag="li" class="nav-link" to="ordermap" active>Order Map</router-link>
        </b-navbar-nav>
    </b-navbar>
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App',
  data: function () {
    return {
      network: false,
      ordermap: true
    }
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
nav li:hover,
nav li.router-link-active,
nav li.router-link-exact-active {
  font-weight: bold;
  text-decoration: underline;
  cursor: pointer;
}
</style>
