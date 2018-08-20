//获取应用实例
let app = getApp()
var API = require('../../api/API.js');
var utils = require('../../utils/util.js');

var mGourmetList = [];
var headerList = [];
var initFlag = false;
var mLoading = false;
var PAGE_SIZE = 50;
var mPage = 1;
var mIsmore = false;

var ga = require('../../utils/ga.js');
var HitBuilders = ga.HitBuilders;

function showMap() {
  var that = this;
  if (mLoading) return; //等待加载完
  if (mGourmetList.length > 0) {
    app.globalData.gourmets = mGourmetList;
    gotoMap()
  } else {
    // 没有点的情况
    wx.showModal({
      title: "周围没有推荐的地道美食",
      content: "不如你来推荐一个？",
      success: function (res) {
        if (res.confirm) {
          console.log('用户点击确定')
          that.addPoint()
        } else {
          console.log('用户点击取消')
          gotoMap()
        }
      }
    })
  }
  function gotoMap() {
    wx.navigateTo({
      url: '../map/map'
    })
  }
}


function setLoading(loading) {
  mLoading = loading;
  utils.showLoading(loading);
}

function loadFirstPage(that) {
  if (!app.globalData.locationInfo) {
    app.getLocationInfo(info => {
      // console.log('先获取位置,', info)
    })
    setTimeout(function() {
      loadFirstPage(that)
    }, 1500);
    return;
  }

  setLoading(true);
  API.getGourmetByPage(1, PAGE_SIZE, (gourmets) => {
    console.log('loadFirstPage', gourmets);
    setLoading(false);
    mGourmetList = gourmets;
    mPage = 1;
    mIsmore = true;
    that.setData({
      gourmets: mGourmetList,
      ismore: mIsmore
    })
  })
  API.getHeaderInfo((header) => {
    setLoading(false);
    headerList = header;
    console.log('headerList', headerList);
    that.setData({
      headers: headerList,
    })
  })
}

Page({
  data: {
    userInfo: wx.getStorageSync(app.globalData.userInfoKey),
    avatarUrl: "",
    app_name: '美食地图',
    ismore: mIsmore,
    gourmets: mGourmetList,
    isShowUserPannel: false,
    //是否显示个人中心面板
    autoplay: true,
    interval: 5000,
    duration: 500,
  },
  showUserPannel: function() {
    let isShow = this.data.isShowUserPannel
    if (!isShow) {
      isShow = true
    } else {
      isShow = false
    }
    this.setData({
      isShowUserPannel: isShow
    })
  },
  showMaps:function(){
    showMap();
  },
  // gotoDetail: function (e) {
  //   if (mLoading) return;
  //   var item = e.target.dataset.item;
  //   if (item) {
  //     wx.navigateTo({
  //       url: '/pages/detail/detail?item=' + JSON.stringify(item)
  //     })
  //   }
  // },
  checkHeader: function(e) {
    var id = e.target.dataset.id;
    var item = e.target.dataset.item;
    if (id == 0) {
      showMap();
    } else if (id == 1) {
      if (item) {
      wx.navigateTo({
        url: '../pageopen/pageopen?item=' + JSON.stringify(item),
      })
      }
    } else if (id == 2) {
      wx.navigateTo({
        url: '',
      })
    }
  },
  //添加美食点点
  addPoint: function() {
    wx.navigateTo({
      url: '/pages/add_gourmet/add_gourmet'
    })
  },
  goReadlog: function() {
    wx.navigateTo({
      url: '/pages/readlog/readlog'
    })
  },
  onLoad: function(options) {
    // Do some initialize when page load.
    API.addLocationPoint()
    this.setData({
      userInfo: app.getUserinfo_1()
    })
  },
  onReady: function() {
    initFlag = true;
    loadFirstPage(this);
  },
  onShow: function() {

    //GoogleAnalytics Collecting page info
    var t = getApp().getTracker();
    t.setScreenName('Index');
    t.send(new HitBuilders.ScreenViewBuilder().build());
    //GoogleAnalytics Collecting User info
    t.set("&uid", app.getUserinfo_1().openid);
    t.send(new HitBuilders.EventBuilder()
      .setCategory("Signin")
      .setAction("User Sign In")
      .build());
    
    if (!initFlag) return;
    if (!app.flags.refresh_index) return;
    app.flags.refresh_index = false;
    loadFirstPage(this);



  },
  onHide: function() {
    this.setData({
      isShowUserPannel: false
    })
  },
  onUnload: function() {},
  onPullDownRefresh: function() {
    wx.stopPullDownRefresh();
    if (mLoading) return;
    if (!initFlag) return;
    loadFirstPage(this);
  },
  onReachBottom: function() {
    this.loadMore()
  },
  gotoDetail: function(e) {
    if (mLoading) return;
    var item = e.target.dataset.item;
    if (item) {
      wx.navigateTo({
        url: '/pages/detail/detail?item=' + JSON.stringify(item)
      })
    }
  },
  onShareAppMessage: function() {
    return {
      title: 'Nanabite美食地图',
      desc: '吃吃吃吃吃！吃点啥好？',
      path: '/pages/index/index'
    }
  },
  loadMore: function() {
    if (!mIsmore) return;
    wx.showNavigationBarLoading();
    var that = this;
    API.getGourmetByPage(mPage + 1, PAGE_SIZE, (gourmets) => {
      console.log('loadMore', gourmets);
      mIsmore = (gourmets.length > 0);
      mPage++;
      mGourmetList = mGourmetList.concat(gourmets);
      that.setData({
        gourmets: mGourmetList,
        ismore: mIsmore
      })
      wx.hideNavigationBarLoading()
    })
  },
  stopScroll: function() {}
})