/* eslint no-use-before-define: 0 */

<template>
  <div id="network-div" class="row">
    <div class="col-10" id="network-chart">
      <svg :width="width" :height="height">
        <g :transform="`translate(0,0)`">
        <rect :width="width" :height="height" style="fill:none; pointer-events: all;"></rect>
          <g id="container">
            <g :id="links"></g>
            <g :id="nodes"></g>
          </g>
        </g>
      </svg>
    </div>
    <div class="col-2">
      <b-container class="jumbotron" id="network-info">
        <b-row class="text-center">
          Max depth : {{ metaData.maxDepth }} <br>
          Total user : {{ metaData.totalUser }} <br>
          추천 한 사람 : {{ metaData.referrer }} <br>
          추천 받은 사람 : {{ metaData.referree }} <br>
          Referral User : {{ metaData.referral }} <br>
          <br>
        </b-row>
        <b-row class="bv-row">
          <div class="dropdown-wrap">
          <b-dropdown id="dropdown-left" :text="selectedOption" variant="primary" class="m-2">
            <b-dropdown-item v-for="(option, idx) in depthOption"
                             :key="idx"
                             :value="'depth-'+option"
                             @click="showDepth(option)"> Depth : {{ option }}</b-dropdown-item>
          </b-dropdown>
          </div>
        </b-row>
      </b-container>
    </div>
  </div>
</template>
<style>
  html, body {
    width: 100%;
    height: 100%;
  }

  .links line {
    stroke: #999;
    stroke-opacity: 0.6;
  }

  .nodes circle {
    stroke: #fff;
    stroke-width: 1.5px;
  }

  text {
    font-family: sans-serif;
    font-size: 10px;
  }

  #network-info {
    margin : 10px;
  }

  #network-div { width: 100%; height:100%; position: fixed;}
  #network-chart { width: 100%; height:100%; position: relative;}

  .dropdown-wrap {
    height: 300px;
    overflow: scroll;
  }
</style>
<script>
import * as d3 from 'd3'
import Datepicker from 'vuejs-datepicker'
var moment = require('moment-timezone')

export default {
  name: 'Network',
  created: function () {
    this.$http.get('/api/data/network')
      .then((response) => {
        this.networkData = response.data.networkData
        this.userData = response.data.userData
        this.metaData = response.data.metaData
        this.startDate = this.metaData.startDate
        this.endDate = this.metaData.endDate
        this.depthOption = ['ALL']
        this.depthOption = this.depthOption.concat(Array.from(Array(this.metaData.maxDepth + 1).keys()))
      })
  },
  data: function () {
    return {
      networkData: null,
      userData: null,
      metaData: { 'maxDepth': 0, 'totalUser': 0, 'referral': 0, 'referrer': 0, 'referree': 0 },
      margin: { top: -5, right: -5, bottom: -5, left: -5 },
      // width: 1600 - this.margin.left - this.margin.right,
      // height: 800 - this.margin.top - this.margin.bottom,
      width: 1600,
      height: 800,
      color: d3.scaleOrdinal(d3.schemeCategory10),
      startDate: new Date(),
      endDate: new Date(),
      depthOption: null,
      selectedOption: 'Choose Depth'
    }
  },
  components: {
    Datepicker
  },
  mounted: function () {
    var that = this

    that.simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(function (d) { return d.id }))
      .force('charge', d3.forceManyBody().strength(-10))
      .force('center', d3.forceCenter(that.width / 2, that.height / 2))

    that.tooltip = d3.select('#network-info').append('b-row')
      .attr('class', 'tooltip')
      .attr('transform', 'translate(' + that.margin.left + ',' + that.margin.top + ')')

    this.setZoom()

    var keys = ['None', 'Referrer', 'Referree', 'Referrer&Referree']
    var legend = d3.select('#network-info').append('b-row').append('svg')
      .attr('height', 400)
      .attr('width', 400)
    legend.append('circle').attr('cx', 50).attr('cy', 230).attr('r', 6).style('fill', that.color(0))
    legend.append('circle').attr('cx', 50).attr('cy', 260).attr('r', 6).style('fill', that.color(1))
    legend.append('circle').attr('cx', 50).attr('cy', 290).attr('r', 6).style('fill', that.color(2))
    legend.append('circle').attr('cx', 50).attr('cy', 320).attr('r', 6).style('fill', that.color(3))
    legend.append('text').attr('x', 70).attr('y', 230).text(keys[0]).style('font-size', '15px').attr('alignment-baseline', 'middle')
    legend.append('text').attr('x', 70).attr('y', 260).text(keys[1]).style('font-size', '15px').attr('alignment-baseline', 'middle')
    legend.append('text').attr('x', 70).attr('y', 290).text(keys[2]).style('font-size', '15px').attr('alignment-baseline', 'middle')
    legend.append('text').attr('x', 70).attr('y', 320).text(keys[3]).style('font-size', '15px').attr('alignment-baseline', 'middle')
  },
  computed: {
    nodes: function () {
      var that = this
      if (this.networkData) {
        var node = d3.select('#container')
          .append('g')
          .attr('class', 'nodes')
          .selectAll('g')
          .data(that.networkData.node)
          .enter().append('g')

        var circles = node.append('circle')
          .attr('r', function (d) { return 5 + d.refere_num / 5 })
          .attr('fill', function (d) { return that.color(d.group) })
          .attr('class', function (d) { return 'depth-' + d.depth })
          .call(
            d3.drag()
              .subject(function (d) { return d })
              .on('start', function dragstarted (d) {
                if (!d3.event.active) that.simulation.alphaTarget(0.3).restart()
                d.fx = d.x
                d.fy = d.y
              })
              .on('drag', function dragged (d) {
                d.fx = d3.event.x
                d.fy = d3.event.y
              })
              .on('end', function dragended (d) {
                if (!d3.event.active) that.simulation.alphaTarget(0)
                d.fx = null
                d.fy = null
              })
          )

        circles.on('mouseover', function (d) {
          that.tooltip.transition()
            .duration(100)
            .style('opacity', 0.9)

          that.tooltip.html('<b>Name</b> : ' + d.name + '<br><b>Referral</b> : ' + d.refere_num + '<br><b>Depth</b> : ' + d.depth + '<br><b>E-mail</b> : ' + that.userData[d.id].email + '<br><b>Sign up</b> : ' + that.userData[d.id].signUp)
        })

        node.append('title')
          .text(function (d) { return d.id })

        return node
      }
    },
    links: function () {
      var that = this
      if (this.networkData) {
        var links = d3.select('#container')
          .append('g')
          .attr('class', 'links')
          .selectAll('line')
          .data(that.networkData.link)
          .enter().append('line')
        return links
      }
    }
  },
  methods: {
    setZoom () {
      this.zoom = d3.zoom()
        .scaleExtent([0.1, 10])
        .on('zoom', function zoomed () {
          const currentTransform = d3.event.transform
          d3.select('#container').attr('transform', currentTransform)
        })

      d3.select('svg').call(this.zoom)
    },
    changeStartDate (date) {
      this.startDate = moment(date).format('YYYY-MM-DDThh:mm:ss')
    },
    changeEndDate (date) {
      this.endDate = moment(date).format('YYYY-MM-DDThh:mm:ss')
    },
    showDepth (option) {
      this.selectedOption = 'Depth ' + option
      if (option === 'ALL') {
        d3.selectAll('circle').attr('opacity', 1).style('stroke', 'white')
      } else {
        d3.selectAll('circle').attr('opacity', 0.2).style('stroke', 'white')
        d3.selectAll('.depth-' + option).attr('opacity', 1).style('stroke', 'black')
      }
    }
  },
  updated: function () {
    var that = this
    that.simulation
      .nodes(that.networkData.node)
      .on('tick', ticked)

    that.simulation.force('link')
      .links(that.networkData.link)

    function ticked () {
      that.links.attr('x1', function (d) { return d.source.x })
        .attr('y1', function (d) { return d.source.y })
        .attr('x2', function (d) { return d.target.x })
        .attr('y2', function (d) { return d.target.y })

      that.nodes.attr('transform', function (d) {
        return 'translate(' + d.x + ',' + d.y + ')'
      })
    }
  }
}
</script>
