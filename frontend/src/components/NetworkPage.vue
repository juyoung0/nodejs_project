/* eslint no-use-before-define: 0 */

<template>
  <div id="network-div" class="row">
    <div class="page-content" id="content">
      <!-- Toggle button
      <button id="sidebarCollapse" type="button" class="btn btn-light bg-white rounded-pill shadow-sm px-4 mb-4"><i class="fa fa-bars mr-2"></i><small class="text-uppercase font-weight-bold">Menu</small></button>
      -->
      <svg id="chartSvg" width="100%" height="100%">
        <g :transform="`translate(0,0)`">
        <rect :width="width" :height="height" style="fill:none; pointer-events: all;"></rect>
          <g id="container">
            <g :id="links"></g>
            <g :id="nodes"></g>
          </g>
        </g>
      </svg>
    </div>
    <!-- Vertical navbar -->
    <div class="vertical-nav bg-white" id="sidebar" style="right:0">
      <div class="py-4 px-3 mb-4 bg-light">
        <div class="media-body">
          <h4 class="m-0">Referral Network</h4>
          <p class="font-weight-light text-muted mb-0">Based on referral code</p>
          <p class="font-weight-light text-muted mb-0">(Facebook friend is excluded)</p>
        </div>
      </div>
      <ul class="nav flex-column bg-white mb-0">
        <li class="nav-item">
          <p class="text-gray font-weight-bold text-uppercase px-3 small pb-4 mb-0">Legend</p>
          <div id="legend-wrap"></div>
        </li>
        <li class="nav-item">
          <p class="text-gray font-weight-bold text-uppercase px-3 small pb-4 mb-0">Show Depth</p>
          <div class="dropdown-wrap">
            <b-dropdown id="dropdown-left" :text="selectedOption" variant="primary" class="m-2">
              <b-dropdown-item v-for="(option, idx) in depthOption"
                               :key="idx"
                               :value="'depth-'+option"
                               @click="showDepth(option)"> Depth : {{ option }}</b-dropdown-item>
            </b-dropdown>
          </div>
        </li>
        <li class="nav-item">
          <p class="text-gray font-weight-bold text-uppercase px-3 small pb-4 mb-0">Summary</p>
          <div id="summary-wrap">
            Max depth : {{ metaData.maxDepth }} <br>
            Total user : {{ metaData.totalUser }} <br>
            Referral user : {{ metaData.referral }} <br>
            Referrer user : {{ metaData.referrer }} <br>
            Referee user : {{ metaData.referree }} <br>
            <br>
          </div>
        </li>
        <li class="nav-item">
          <p class="text-gray font-weight-bold text-uppercase px-3 small pb-4 mb-0">User Information</p>
          <div id="tooltip-wrap">
            <b>Name</b><br><b>Referral</b><br><b>Depth</b><br><b>E-mail</b><br><b>Sign up</b>
          </div>
        </li>
      </ul>
    </div>
    <!-- End vertical navbar -->
  </div>
</template>
<style>
  html, body {
    width: 100%;
    height: 100%;
    overflow-x: hidden;
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
  #network-div { width: 100%; height:100%; position: fixed;}
  #network-chart { width: 100%; height:100%; position: relative;}

  .dropdown-wrap {
    margin-top: -20px;
    margin-bottom: 20px;
  }

  #legend-wrap {
    margin-top: -10px;
  }

  #tooltip-wrap {
    margin-left: 20px;
  }

  .vertical-nav {
    min-width: 17rem;
    width: 17rem;
    height: 100vh;
    position: fixed;
    right: 0;
    box-shadow: 3px 3px 10px rgba(0, 0, 0, 0.1);
    transition: all 0.4s;
  }
  .page-content {
    width: calc(100% - 17rem);
    margin-right: 17rem;
    transition: all 0.4s;
  }

  #sidebar.active {
    margin-right: -17rem;
  }

  #content.active {
    width: 100%;
    margin: 0;
  }

  #summary-wrap {
    text-align: left;
    margin-left: 30px;
  }
</style>
<script>
import * as d3 from 'd3'
import Datepicker from 'vuejs-datepicker'
var moment = require('moment-timezone')

export default {
  name: 'Network',
  created: function () {
    this.$http.get('/api/data/network_csv')
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
    // d3.select('#chartSvg').attr('viewBox', [-this.width / 2, -this.height / 2, this.width, this.height])

    that.simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(function (d) { return d.id }))
      .force('charge', d3.forceManyBody().strength(-10))
      // .force('x', d3.forceX())
      // .force('y', d3.forceY())
      .force('center', d3.forceCenter(that.width / 2, that.height / 2))

    that.tooltip = d3.select('#tooltip-wrap')
      .attr('class', 'tooltip')

    this.setZoom()

    var keys = ['None', 'Referrer', 'Referee', 'Referrer & Referee']
    var legend = d3.select('#legend-wrap').append('svg')
      .attr('width', '100%')
    legend.append('circle').attr('cx', 50).attr('cy', 15).attr('r', 6).style('fill', that.color(0)).attr('class', 'legend-circle')
    legend.append('circle').attr('cx', 50).attr('cy', 45).attr('r', 6).style('fill', that.color(1)).attr('class', 'legend-circle')
    legend.append('circle').attr('cx', 50).attr('cy', 75).attr('r', 6).style('fill', that.color(2)).attr('class', 'legend-circle')
    legend.append('circle').attr('cx', 50).attr('cy', 105).attr('r', 6).style('fill', that.color(3)).attr('class', 'legend-circle')
    legend.append('text').attr('x', 70).attr('y', 15).text(keys[0]).style('font-size', '15px').attr('alignment-baseline', 'middle')
    legend.append('text').attr('x', 70).attr('y', 45).text(keys[1]).style('font-size', '15px').attr('alignment-baseline', 'middle')
    legend.append('text').attr('x', 70).attr('y', 75).text(keys[2]).style('font-size', '15px').attr('alignment-baseline', 'middle')
    legend.append('text').attr('x', 70).attr('y', 105).text(keys[3]).style('font-size', '15px').attr('alignment-baseline', 'middle')
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
            // Use D3 to select element, change color and size
          d3.select(this).style('stroke', 'black')

          that.tooltip.html('<b>Name</b> : ' + d.name + '<br><b>Referral</b> : ' + d.refere_num + '<br><b>Depth</b> : ' + d.depth + '<br><b>E-mail</b> : ' + that.userData[d.id].email + '<br><b>Sign up</b> : ' + that.userData[d.id].signUp)
        })

        circles.on('mouseout', function (d) {
          d3.select(this).style('stroke', 'white')
        })

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
      d3.selectAll('.legend-circle').attr('opacity', 1).style('stroke', 'white')
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

$(function () {
  // Sidebar toggle behavior
  $('#sidebarCollapse').on('click', function () {
    $('#sidebar, #content').toggleClass('active')
  })
})
</script>
