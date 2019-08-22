<template>
  <div id="ordermap-div" class="row">
    <div class="page-content" id="content">
     <!-- <button id="sidebarCollapse" type="button" class="btn btn-light bg-white rounded-pill shadow-sm px-4 mb-4"><i class="fa fa-bars mr-2"></i><small class="text-uppercase font-weight-bold">Menu</small></button>-->
      <div :id="fetchData"></div>
      <l-map
        ref="map"
        style="height: 100%; width: 100%"
        :zoom="zoom"
        :center="center"
        @update:zoom="zoomUpdated"
        @update:center="centerUpdated"
        @update:bounds="boundsUpdated"
      >
        <l-icondefault></l-icondefault>
        <l-tile-layer :url="url"></l-tile-layer>
        <div class="customer-marker">
          <l-marker-cluster :options="clusterOptions">
          <l-marker :visible="showCustomer && point.visible" v-for="(point, idx) in latlngPoint.customer" :lat-lng="point.latlng" v-bind:key="idx" :id="'customer-'+point.orderID" v-on:click="mouseOnCustomer(point.uid)" :class="point.service" >
            <I-tooltip>
              <b>Name</b> : {{ point.name }}<br>
              <b>Service</b> : {{ point.service }}<br>
              <b>Distance</b> : {{ point.dist }} m<br>
              <b>Amount</b> : {{ point.amount/100 }} $<br>
              <b>Order Time</b> : {{ point.time }} <br>
              <b>Order ID</b> : {{ point.orderID }} <br>
            </I-tooltip>
          </l-marker>
          </l-marker-cluster>
        </div>
        <div class="store-marker">
          <l-marker-cluster :options="clusterOptions">
          <l-marker :visible="showStore && point.visible" v-for="(point, idx) in latlngPoint.store" :lat-lng="point.latlng" v-bind:key="idx" :id="'store-'+point.latlng.toString()" v-on:click="mouseOnStore(point.latlng.toString())" :class="point.service">
          <l-icon
            :icon-size="dynamicSize"
            :icon-anchor="dynamicAnchor"
            icon-url="static/images/red.png">
          </l-icon>
          <I-tooltip>
            <b>Service</b> : {{ point.service }}<br>
            <b># of Order</b> : {{ point.count }} <br>
          </I-tooltip>
        </l-marker>
        </l-marker-cluster>
        </div>
      </l-map>
    </div>
    <!-- Vertical navbar -->
    <div class="vertical-nav bg-white" id="sidebar">
      <div class="py-4 px-3 mb-4 bg-light">
        <div class="media-body">
          <h4 class="m-0">Order map</h4>
          <p class="font-weight-light text-muted mb-0">Based on finished order</p>
        </div>
      </div>
      <ul class="nav flex-column bg-white mb-0">
        <li class="nav-item">
          <b-row class="bv-row">
            <b-col cols="4">
              <datepicker :value="startDate" name="startDate" @selected="changeStartDate" :format="customFormatter"></datepicker>
            </b-col>
            <b-col cols="4">
              <datepicker :value="endDate" name="endDate" @selected="changeEndDate" :format="customFormatter"></datepicker>
            </b-col>
            <b-col cols="4" class="my-selector">
              <b-button variant="primary"  v-on:click="changeDate">Update</b-button>
            </b-col>
          </b-row>
        </li>
        <li class="nav-item">
          <b-row class="bv-row">
            <b-col class="my-selector">
              <b-button-group>
                <b-button :pressed="showSF" variant="outline-warning" v-on:click="center = SFcenter; showSF=true; zoom=10">SF</b-button>
                <b-button :pressed="!showSF" variant="outline-warning" v-on:click="center = NYcenter; showSF=false; zoom=10">NY</b-button>
              </b-button-group>
            </b-col>
          </b-row>
          <b-row class="bv-row">
            <b-col class="my-selector">
              <b-button-group>
                <b-button :pressed="showStore&&!showCustomer" variant="outline-danger" v-on:click="showStore = true; showCustomer = false">Store</b-button>
                <b-button :pressed="!showStore&&showCustomer" variant="outline-info" v-on:click="showStore = false; showCustomer = true">Customer</b-button>
                <!--<b-button :pressed="showStore&&showCustomer" variant="outline-success" v-on:click="showStore = true; showCustomer = true">Both</b-button>-->
              </b-button-group>
            </b-col>
          </b-row>
        </li>
        <li class="nav-item">
          <b-row class="bv-row">
            <b-col class="my-selector">
              <b-button-group>
                <b-button :pressed="showStoreTable" variant="outline-dark" v-on:click="showStoreTable = true;">Store Table</b-button>
                <b-button :pressed="!showStoreTable" variant="outline-dark" v-on:click="showStoreTable = false;">Customer Table</b-button>
              </b-button-group>
              <b-button v-on:click="showAll">초기화</b-button>
            </b-col>
          </b-row>
        </li>
        <li class="nav-item">
          <template>
            <div v-if="showStoreTable" class="pre-scrollable table-wrap">
              <b-table responsive striped hover :items="latlngPoint['store']" :fields="storeFields"
                       id="store-table"
                       class="my-table"
                       selectable
                       select-mode="single"
                       selectedVariant="success"
                       @row-selected="storeSelected"></b-table>
            </div>
            <div v-else class="pre-scrollable table-wrap">
              <b-table responsive striped hover :items="customerData" :fields="customerFields"
                       id="customer-table"
                       class="my-table"
                       selectable
                       select-mode="single"
                       selectedVariant="success"
                       @row-selected="customerSelected"></b-table>
            </div>
          </template>
        </li>
      </ul>
    </div>
    <!-- End vertical navbar -->
  </div>
</template>
<script>
import Vue from 'vue'
import * as Vue2Leaflet from 'vue2-leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import * as L from 'leaflet'
import Datepicker from 'vuejs-datepicker'
import { mdbDatatable } from 'mdbvue'
import VueOverflowScroll from 'vue-overflow-scroll'
import Vue2LeafletMarkerCluster from 'vue2-leaflet-markercluster'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

var moment = require('moment-timezone')

Vue.component('l-map', Vue2Leaflet.LMap)
Vue.component('l-tile-layer', Vue2Leaflet.LTileLayer)
Vue.component('l-circle-marker', Vue2Leaflet.LCircleMarker)
Vue.component('l-marker', Vue2Leaflet.LMarker)
Vue.component('l-icondefault', Vue2Leaflet.LIconDefault)
Vue.component('l-icon', Vue2Leaflet.LIcon)
Vue.component('I-tooltip', Vue2Leaflet.LTooltip)
Vue.component('mdb-datatable', mdbDatatable)
Vue.component('l-marker-cluster', Vue2LeafletMarkerCluster)
Vue.use(VueOverflowScroll)

export default {
  name: 'OrderMapPage',
  created: function () {
    this.latlngPoint = {'customer': [], 'store': []}
    this.$http.get('/api/data/order')
      .then((response) => {
        this.orderData = response.data.orderData
        this.storeData = response.data.uniqueStore
        this.startDate = response.data.timeline.startDate
        this.endDate = response.data.timeline.endDate
        this.customerData = response.data.uniqueCustomer
        this.loadDataset()
      })
  },
  data: function () {
    let customicon = L.icon(Object.assign({},
      L.Icon.Default.prototype.options,
      {iconUrl, shadowUrl}
    ))
    return {
      map: null,
      showCustomer: true,
      showStore: false,
      showStoreTable: true,
      showSF: false,
      orderData: null,
      storeData: null,
      customerData: null,
      latlngPoint: null,
      selectedRow: null,
      customerClicked: false,
      storeClicked: false,
      currentPage: { customer: 1, store: 1 },
      margin: { top: -5, right: -5, bottom: -5, left: -5 },
      // width: 1600 - this.margin.left - this.margin.right,
      // height: 800 - this.margin.top - this.margin.bottom,
      width: 1600,
      height: 800,
      url: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
      zoom: 10,
      NYcenter: [40.70, -73.95],
      SFcenter: [37.58, -122.17],
      center: [40.70, -73.95],
      bounds: null,
      icon: customicon,
      clusterOptions: {},
      storeicon: L.icon({
        iconUrl: 'static/images/red.png',
        iconSize: [100, 100],
        iconAnchor: [50, 100]
      }),
      iconSize: 32,
      circle: {
        center: [47.413220, -1.0482],
        radius: 6,
        color: 'red'
      },
      startDate: new Date(),
      endDate: new Date(),
      storeFields: [
        {
          key: 'service',
          label: '서비스 종류',
          sortable: true
        },
        {
          key: 'count',
          label: '서비스 횟수',
          sortable: true
        } /* ,
        {
          key: 'avgAmount',
          label: '평균주문금액($)',
          sortable: true
        } */
      ],
      customerFields: [
        {
          key: 'name',
          label: '이름',
          sortable: true
        },
        {
          key: 'count',
          label: '주문수',
          sortable: true
        } /* ,
        {
          key: 'avgAmount',
          label: '평균주문금액($)',
          sortable: true
        } */
      ]
    }
  },
  components: {
    Datepicker
  },
  mounted: function () {
    this.$nextTick(() => {
      this.map = this.$refs.map.mapObject
    })
    setTimeout(() => {
      this.$nextTick(() => {
        this.clusterOptions = { disableClusteringAtZoom: 11 }
      })
    }, 5000)
  },
  computed: {
    dynamicSize () {
      return [this.iconSize * 3 / 4, this.iconSize * 5 / 4]
    },
    dynamicAnchor () {
      return [this.iconSize / 2, this.iconSize]
    },
    storeRows () {
      return this.latlngPoint['store'].length
    },
    customerRows () {
      return this.latlngPoint['customer'].length
    }
  },
  methods: {
    zoomUpdated (zoom) {
      this.zoom = zoom
    },
    centerUpdated (center) {
      this.center = center
    },
    boundsUpdated (bounds) {
      this.bounds = bounds
    },
    fetchData () {
      if (this.latlngPoint) {
        return true
      }
      return false
    },
    loadDataset () {
      var that = this

      if (that.orderData) {
        Object.keys(this.orderData).map(function (key, idx) {
          that.latlngPoint['customer'].push({'uid': that.orderData[key].userID, 'latlng': [that.orderData[key].customerLat, that.orderData[key].customerLng], 'storeLatlng': [that.orderData[key].storeLat, that.orderData[key].storeLng], 'orderID': key, 'name': that.orderData[key].name, 'service': that.orderData[key].service, 'time': that.orderData[key].time, 'amount': that.orderData[key].amount, 'dist': that.orderData[key].dist.toFixed(2), 'avgDist': that.orderData[key].avgDist, 'avgAmount': that.orderData[key].avgAmount, 'visible': true})
        })
      }
      if (that.storeData) {
        this.storeData.map(function (store) {
          that.latlngPoint['store'].push({'uid': store.uid, 'latlng': store.latlng, 'service': store.service, 'count': store.count, 'avgDist': store.avgDist, 'avgAmount': store.avgAmount, 'visible': true})
        })
      }
      return true
    },
    changeStartDate (date) {
      this.startDate = moment(date).format('YYYY-MM-DDThh:mm:ss')
    },
    changeEndDate (date) {
      this.endDate = moment(date).format('YYYY-MM-DDThh:mm:ss')
    },
    changeDate () {
      this.$http.get('/api/data/order', JSON.stringify({}))
        .then((response) => {
          this.orderData = response.data.orderData
          this.storeData = response.data.uniqueStore
          this.startDate = response.data.timeline.startDate
          this.endDate = response.data.timeline.endDate
          this.customerData = response.data.uniqueCustomer
          this.loadDataset(response)
        })
      // this.latlngPoint['customer'].map(function (order) {
      //   if (order.time >= that.startDate && order.time <= that.endDate) {
      //     order.visible = true
      //   } else {
      //     order.visible = false
      //   }
      // })
    },
    mouseOnStore (storeLatlng) {
      this.customerClicked = null
      if (this.storeClicked === storeLatlng) {
        this.showCustomer = false
        this.storeClicked = null
        this.mouseOut()
      } else {
        this.showStore = true
        this.showCustomer = true
        this.storeClicked = storeLatlng
        this.markInteraction = true
        this.latlngPoint['store'].map(function (store) {
          if (store.latlng.toString() === storeLatlng) {
            store.visible = true
          } else {
            store.visible = false
          }
        })
        this.latlngPoint['customer'].map(function (order) {
          if (order.storeLatlng.toString() === storeLatlng) {
            order.visible = true
          } else {
            order.visible = false
          }
        })
      }
    },
    mouseOnCustomer (customerID) {
      this.storeClicked = null
      if (this.customerClicked === customerID) {
        this.showStore = false
        this.customerClicked = null
        this.mouseOut()
      } else {
        this.showStore = true
        this.showCustomer = true
        this.customerClicked = customerID
        this.markInteraction = true
        this.latlngPoint['customer'].map(function (order) {
          if (order.uid === customerID) {
            order.visible = true
          } else {
            order.visible = false
          }
        })
        this.latlngPoint['store'].map(function (store) {
          if (store.uid.includes(customerID)) {
            store.visible = true
          } else {
            store.visible = false
          }
        })
      }
    },
    mouseOut () {
      var that = this

      if (this.selectedRow === null) {
        this.latlngPoint['store'].map(function (store) {
          store.visible = true
        })
        this.latlngPoint['customer'].map(function (order) {
          if (order.time >= that.startDate && order.time <= that.endDate) {
            order.visible = true
          } else {
            order.visible = false
          }
        })
      } else {
        if (this.showStoreTable) {
          this.mouseOnStore(this.selectedRow[0].latlng.toString())
        } else {
          this.mouseOnCustomer(this.selectedRow[0].uid)
        }
      }
    },
    storeSelected (items) {
      this.showStore = true
      this.showCustomer = true
      if (this.selectedRow === items) {
        this.selectedRow = null
      } else {
        this.selectedRow = items
      }

      if (items.length > 0) {
        this.mouseOnStore(items[0].latlng.toString())
        this.center = items[0].latlng
      }
    },
    customerSelected (items) {
      this.showStore = true
      this.showCustomer = true
      if (this.selectedRow === items) {
        this.selectedRow = null
      } else {
        this.selectedRow = items
      }

      if (items.length > 0) {
        this.mouseOnCustomer(items[0].uid)
        this.center = items[0].latlng
      }
    },
    showAll () {
      $('.b-table-row-selected').attr('class', '')
      this.center = this.NYcenter
      this.selectedRow = null
      this.showStore = false
      this.showCustomer = true
      this.mouseOut()
    },
    customFormatter (date) {
      return moment(date).format('MMM d')
    }
  }
}

$(function () {
  // Sidebar toggle behavior
  $('#sidebarCollapse').on('click', function () {
    $('#sidebar, #content').toggleClass('active')
  })
})
</script>
<style scoped>
  @import "../../node_modules/leaflet.markercluster/dist/MarkerCluster.css";
  @import "../../node_modules/leaflet.markercluster/dist/MarkerCluster.Default.css";
  html, body {
    width: 100%;
    height: 100%;
    overflow:hidden;
    margin: 0;
  }
  text {
    font-family: sans-serif;
    font-size: 10px;
  }

  #ordermap-div { width: 100%; height:100%; position: fixed;}
  #content { width: 100%; height:100%; position: relative;}

  .bv-row {
    padding : 5px;
  }
  .table-wrap {
    height: 500px;
  }

  .vertical-nav {
    min-width: 25rem;
    width: 25rem;
    height: 100vh;
    position: fixed;
    right: 0;
    box-shadow: 3px 3px 10px rgba(0, 0, 0, 0.1);
    transition: all 0.4s;
  }
  .page-content {
    width: calc(100% - 25rem);
    margin-right: 25rem;
    transition: all 0.4s;
  }

  #sidebar.active {
    margin-right: -25rem;
  }

  #content.active {
    width: 100%;
    margin: 0;
  }

  .vdp-datepicker input{
    width: 75px;
    height: 20px;
  }

  .my-selector {
    margin-bottom: 5px;
  }
</style>
