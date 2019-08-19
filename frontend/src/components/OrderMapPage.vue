<template>
  <div id="ordermap-div" class="row">
    <div class="col-8" id="ordermap-chart">
      <div :id="fetchData"></div>
      <l-map
        ref="map"
        style="height: 80%; width: 100%"
        :zoom="zoom"
        :center="center"
        @update:zoom="zoomUpdated"
        @update:center="centerUpdated"
        @update:bounds="boundsUpdated"
      >
        <l-tile-layer :url="url"></l-tile-layer>
        <div class="customer-marker">
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
        </div>
        <div class="store-marker">
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
        </div>
      </l-map>
    </div>
    <div class="col-4">
      <b-container id="ordermap-info">
        <b-row class="bv-row">
          <b-col>
            <datepicker :value="startDate" name="startDate" @selected="changeStartDate"></datepicker>
          </b-col>
          <b-col>
            <datepicker :value="endDate" name="endDate" @selected="changeEndDate"></datepicker>
          </b-col>
          <b-col>
            <b-button variant="primary"  v-on:click="changeDate">Update</b-button>
          </b-col>
        </b-row>
        <b-row class="bv-row">
          <b-col class="city-selector">
            <b-button-group>
              <b-button :pressed="showSF" variant="outline-warning" v-on:click="center = SFcenter; showSF=true">SF</b-button>
              <b-button :pressed="!showSF" variant="outline-warning" v-on:click="center = NYcenter; showSF=false">NY</b-button>
            </b-button-group>
          </b-col>
          <b-col class="type-selector">
            <b-button-group>
              <b-button :pressed="showStore&&!showCustomer" variant="outline-danger" v-on:click="showStore = true; showCustomer = false">Store</b-button>
              <b-button :pressed="!showStore&&showCustomer" variant="outline-info" v-on:click="showStore = false; showCustomer = true">Customer</b-button>
              <b-button :pressed="showStore&&showCustomer" variant="outline-success" v-on:click="showStore = true; showCustomer = true">Both</b-button>
            </b-button-group>
          </b-col>
        </b-row>
        <!--
        <span>Center: {{ center }}</span>
        <span>Zoom: {{ zoom }}</span>
        <span>Bounds: {{ bounds }}</span>
        -->
        <b-row class="bv-row">
          <b-col>
          <div class="table-selector">
            <b-button-group>
              <b-button :pressed="showStoreTable" variant="outline-dark" v-on:click="showStoreTable = true;">Store Table</b-button>
              <b-button :pressed="!showStoreTable" variant="outline-dark" v-on:click="showStoreTable = false;">Customer Table</b-button>
            </b-button-group>
            <b-button v-on:click="showAll">초기화</b-button>
          </div>
          </b-col>
        </b-row>
      </b-container>
      <template>
        <div v-if="showStoreTable" class="pre-scrollable table-wrap">
          <!--<b-pagination
            v-model="currentPage.store"
            :total-rows="storeRows"
            :per-page="perPage"
            aria-controls="store-table"
            align="center"
          ></b-pagination>
          <p class="mt-3">Current Page: {{ currentPage.store }}</p>-->
          <b-table responsive striped hover :items="latlngPoint['store']" :fields="storeFields"
                   id="store-table"
                   selectable
                   select-mode="single"
                   selectedVariant="success"
                   @row-selected="storeSelected"></b-table>
        </div>
        <div v-else class="pre-scrollable table-wrap">
          <!--
          <mdb-datatable
            :data="{'columns': customerFields, 'rows': customerData}"
            striped
            bordered
            fixed
            scrollY
            maxHeight="200px"
            :pagination="false"
          />-->
          <b-table responsive striped hover :items="customerData" :fields="customerFields"
                   id="customer-table"
                   selectable
                   select-mode="single"
                   selectedVariant="success"
                   @row-selected="customerSelected"></b-table>
        </div>
      </template>
    </div>
  </div>
</template>
<script>
import Vue from 'vue'
import * as Vue2Leaflet from 'vue2-leaflet'
import 'leaflet/dist/leaflet.css'
import * as L from 'leaflet'
import Datepicker from 'vuejs-datepicker'
import { mdbDatatable } from 'mdbvue'
import VueOverflowScroll from 'vue-overflow-scroll'

var moment = require('moment-timezone')

Vue.component('l-map', Vue2Leaflet.LMap)
Vue.component('l-tile-layer', Vue2Leaflet.LTileLayer)
Vue.component('l-circle-marker', Vue2Leaflet.LCircleMarker)
Vue.component('l-marker', Vue2Leaflet.LMarker)
Vue.component('l-icon', Vue2Leaflet.LIcon)
Vue.component('I-tooltip', Vue2Leaflet.LTooltip)
Vue.component('mdb-datatable', mdbDatatable)
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
    return {
      map: null,
      showCustomer: true,
      showStore: true,
      showStoreTable: true,
      showSF: false,
      orderData: null,
      storeData: null,
      customerData: null,
      latlngPoint: null,
      selectedRow: null,
      perPage: 6,
      customerClicked: false,
      storeClcied: false,
      currentPage: { customer: 1, store: 1 },
      margin: { top: -5, right: -5, bottom: -5, left: -5 },
      // width: 1600 - this.margin.left - this.margin.right,
      // height: 800 - this.margin.top - this.margin.bottom,
      width: 1600,
      height: 800,
      url: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
      zoom: 11,
      NYcenter: [40.70, -73.95],
      SFcenter: [37.58, -122.17],
      center: [40.70, -73.95],
      bounds: null,
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
          sortable: true
        },
        {
          key: 'count',
          label: 'Service #',
          sortable: true
        },
        {
          key: 'avgDist',
          label: 'Avg. Dist (m)',
          sortable: true
        },
        {
          key: 'avgAmount',
          label: 'Avg. Amount ($)',
          sortable: true
        }
      ],
      customerFields: [
        {
          key: 'name',
          label: 'name',
          sortable: true
        },
        {
          key: 'count',
          label: 'Order #',
          sortable: true
        },
        {
          key: 'avgDist',
          label: 'Avg. Dist (m)',
          sortable: true
        },
        {
          key: 'avgAmount',
          label: 'Avg. Amount ($)',
          sortable: true
        }
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
        this.storeClicked = null
        this.mouseOut()
      } else {
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
        this.customerClicked = null
        this.mouseOut()
      } else {
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
      this.mouseOut()
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
  text {
    font-family: sans-serif;
    font-size: 10px;
  }
  #ordermap-info {
    margin : 10px;
  }
  #ordermap-div { width: 100%; height:100%; position: fixed;}
  #ordermap-chart { width: 100%; height:100%; position: relative;}
  .bv-row {
    padding : 5px;
  }
  .table-wrap {
    height: 100%;
  }
</style>
