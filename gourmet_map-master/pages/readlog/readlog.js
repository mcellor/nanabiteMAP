let app = getApp()

// pages/readlog/readlog.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    avatarUrl: "",
    userInfo: "",
    readLogs: [],
    commentLogs: [],
    keepLogs: [],
    maskDisplay: "none",
    ijiRead: !0,
    ijiComment: !1,
    ijiKeep: !1

  },

  ijiRead: function (t) {
    this.setData({
      ijiRead: !0,
      ijiComment: !1,
      ijiKeep: !1
    });
  },
  ijiComment: function (t) {
    this.setData({
      ijiRead: !1,
      ijiComment: !0,
      ijiKeep: !1
    });
  },
  ijiKeep: function (t) {
    this.setData({
      ijiRead: !1,
      ijiComment: !1,
      ijiKeep: !0
    });
  },
  onLoad: function (options) {
    this.setData({
      userInfo: app.getUserinfo_1()
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.setData({
      readLogs: (wx.getStorageSync("readLogs") || []).map(function (t) {
        return t;
      }),
      commentLogs: (wx.getStorageSync("commentLogs") || []).map(function (t) {
        return t;
      }),
      keepLogs: (wx.getStorageSync("keepLogs") || []).map(function (t) {
        return t;
      })
    });
  },

  redictDetail: function (e) {
    var item = e.target.dataset.item[3];
    console.log(item);
    if (item) {
      wx.navigateTo({
        url: '/pages/detail/detail?item=' + JSON.stringify(item)
      })
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})