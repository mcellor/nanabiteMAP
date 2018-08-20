var app = getApp();
var Bmob = require('../../utils/bmob.js');
var utils = require('../../utils/util.js');
var API = require('../../api/API.js');

var gourmet = null;
var mComments = [];
//
const PAGE_SIZE = 10;
var mPage = 1;
var mIsmore = true;
var mLoading = false;
var mIsSupportOk = false;

function setLoading(loading) {
  mLoading = loading;
  utils.showLoading(loading);
  loading ? wx.showNavigationBarLoading() : wx.hideNavigationBarLoading()
}

var loadSupportSataus = function(gourmetID, that) {
  API.getGourmetSupportInfo(gourmetID, (evaluation) => {
    console.log('evaluation', JSON.stringify(evaluation));
    if (!evaluation || (evaluation && !evaluation.has)) { //没有评价过
      mIsSupportOk = true;
    }
    if (evaluation && evaluation.has) {
      toggleSupport(that, evaluation.support)
    }
  })
}

var toggleSupport = function(that, support) {
  if (support) {
    that.setData({
      ic_support: "/imgs/ic_heartfull.png"
    })
  } else {
    that.setData({
      ic_unsupport: "/imgs/ic_heart.png"
    })
  }
}

//comments
var Comment = Bmob.Object.extend("comment");

function getComments(page, cb) {
  setLoading(true);
  var query = new Bmob.Query(Comment);
  query.equalTo("gourmet_id", gourmet.objectId);
  query.descending("updatedAt");
  query.limit(PAGE_SIZE);
  query.skip(PAGE_SIZE * (page - 1));
  //关联查询 头像 昵称
  query.find({
    success: function(results) {
      setLoading(false);
      // console.log(page, results);
      var jsonData = JSON.parse(JSON.stringify(results));
      //切换时间为友好时间
      for (var x in jsonData) {
        console.log((jsonData[0].create_time));
        jsonData[x].create_time_tag = utils.dateStr(jsonData[x].create_time)
      }
      if (cb) cb(jsonData)
    },
    error: function(error) {
      setLoading(false);
      console.log("查询失败: " + error.code + " " + error.message);
    }
  });
}



Page({
  data: {
    showDialog: false,
    // show: false,
    // isShowUserPannel: false,
    urls: [],
    indicatorDots: true,
    autoplay: true,
    interval: 4000,
    duration: 1000,
    keepBindtap: "keep",  ///

      //
    hide_loadmore: true,
    ic_support: "/imgs/ic_heart.png",
    ic_unsupport: "/imgs/ic_heart.png"
  },
  onLoad: function(option) {
    var that = this;
    if (option.item) {
      gourmet = JSON.parse(option.item);
      that.setData({
        gourmet: gourmet
      })
      //检查是否已经浏览过
      var logs = wx.getStorageSync('readLogs') || [];
      if (logs.length > 0) {
        logs = logs.filter(function (log) {
          return log[0] !== gourmet.objectId;
        });
      }
      //检查是否收藏过
      var markedlogs = wx.getStorageSync('keepLogs') || [];
      if (markedlogs.length > 0) {
        markedlogs = markedlogs.filter(function (log) {
          return log[0] == gourmet.objectId;
        });
        // console.log("!!!!",markedlogs)
        if(markedlogs.length>0){
          that.setData({
            keepBindtap: 'cancelKeep'
        })
        }
      }
      // 如果超过指定数量
      if (logs.length > 19) {
        logs.pop(); //去除最后一个
      }
      logs.unshift([gourmet.objectId, gourmet.title, gourmet.head_url,gourmet]);
      wx.setStorageSync('readLogs', logs);

      loadFirstPage(this);
      loadSupportSataus(gourmet.objectId, that);
    } else {
      setLoading(true);
      var Gourmet = Bmob.Object.extend("gourmet");
      var query = new Bmob.Query(Gourmet);
      query.get(option.id, {
        success: function(result) {
          setLoading(false);
          gourmet = JSON.parse(JSON.stringify(result));
          that.setData({
            gourmet: gourmet
          })
          loadFirstPage(this);
          loadSupportSataus(gourmet.objectId, that);
        },
        error: function(object, error) {
          // 查询失败
          setLoading(false);
          utils.showModal('错误', '请求出错');
        }
      });
    }

    //
    app.getSystemInfo((width, height) => {
      that.setData({
        img_width: width,
        img_height: width * 9 / 16
      })
    })
    //
    mIsSupportOk = false; //防止用户马上点赞
  },
  onHide() {
    this.setData({
      isShowUserPannel: false
    })
  },
  /////
  keep: function () {
    var t = wx.getStorageSync("keepLogs") || [], e = this.data.gourmet.objectId;
    t.length > 0 && (t = t.filter(function (t) {
      return t[0] !== e;
    })), t.length > 999 && t.pop(), t.unshift([e, this.data.gourmet.title, this.data.gourmet.head_url, this.data.gourmet]),
      wx.setStorageSync("keepLogs", t), this.setData({
        keepBindtap: "cancelKeep"
      }), wx.showToast({
        title: "收藏成功",
        icon: "success",
        mask: !1,
        duration: 1e3
      });
  },////

  cancelKeep: function () {
    var t = wx.getStorageSync("keepLogs") || [], e = this.data.gourmet.objectId;
    t.length > 0 && (t = t.filter(function (t) {
      return t[0] !== e;
    })), wx.setStorageSync("keepLogs", t), this.setData({
      keepBindtap: "keep"
    }), wx.showToast({
      title: "已取消收藏",
      icon: "success",
      mask: !1,
      duration: 1e3
    });
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


  preview: function() {
      if (gourmet) {
        wx.previewImage({
          current: gourmet.urls[0], // 当前显示图片的http链接
          urls: gourmet.urls // 需要预览的图片http链接列表
        })
      }
    }

    ,
  inputComment: function(e) {
      this.setData({
        commContent: e.detail.value
      })
    }

    ,
  addComment: function(e) {
      var that = this;
      var content = this.data.commContent;
      if (content == "" || content == null) {
        return utils.showModal('错误', '请输入评论')
      }
      app.getUserInfo(userinfo => {
        //
        // utils.showLoading("loading")
        addComment(gourmet.objectId, userinfo, content, (ok, newComment) => {
          if (ok) {
            that.setData({
              //新增成功之后，清空输入框
              commContent: "",
              show_comment: false,
              focus: false,
              showDialog: false
            });
            // toggleDialogHandle();
            loadFirstPage(that);
          }
          // utils.hideLoading();
        });
      })
    }

    ,
  openLocation: function() {
      wx.openLocation({
        latitude: gourmet.location.latitude,
        longitude: gourmet.location.longitude,
        scale: 28
      })
    }

    ,
  onLoadMore: function() {
      if (mLoading) return;
      if (!mIsmore) return;
      var that = this;
      getComments(mPage + 1, function(comments) {
        if (comments && comments.length > 0) {
          mPage++;
          mComments = mComments.concat(comments);
          if (comments.length > 0) {
            that.setData({
              comments: mComments
            });
          }
        } else {
          mIsmore = false;
          that.setData({
            hide_loadmore: true
          })
        }
      })
    }

    ,
  onShareAppMessage: function() {
      return {
        title: gourmet.title,
        desc: gourmet.description,
        path: '/pages/detail/detail?item=' + JSON.stringify(gourmet)
        //path: '/pages/detail/detail?id='+gourmet.objectId
      }
    }

    ,
  onReachBottom: function() {
      // Do something when page reach bottom.
      console.log('bottom');
      this.onLoadMore();
    }
    //组织事件冒泡
    ,
  stopScroll: function() {
      console.log('stopScoll')
    }
    //open comment layour
    ,
  openComment: function() {
      this.setData({
        show_comment: true,
        focus: true
      })
    }
    //close comment layout
    ,
  closeComment: function() {
      this.setData({
        show_comment: false,
        focus: false
      })
    }
    //addSupport
    ,
  addSupport: function() {
    var that = this;
    if (!mIsSupportOk) return;
    if (!that.data.gourmet) return;
    API.addEvaluation(that.data.gourmet.objectId, true);
    var oldNumber = that.data.gourmet.support ? that.data.gourmet.support : 0;
    console.log(oldNumber);
    var newNumber = oldNumber + 1;
    that.data.gourmet.support = newNumber;
    this.setData({
      gourmet: that.data.gourmet
    })
    toggleSupport(that, true)
    mIsSupportOk = false;
  },
  //打开评论弹出层
  toggleDialogHandle: function() {
      this.showDialog = !this.showDialog;
      var that = this;

      this.setData({
        showDialog: this.showDialog
      })
    }


    // ,getShareArticle: function getShareArticle() {
    //   var that = this;

    //   console.log(that.data.gourmet.address);


    //   wx.showLoading({ title: '\u751F\u6210\u56FE\u7247\u4E2D', mask: true });
    //   var ctx = wx.createCanvasContext('shareCanvas');
    //   //var img = that.data.gourmet.head_url;
    //   //var tmg = img.replace(/http:/g, 'http:');
    //   var tit = that.data.gourmet.address;
    //   var tsp = tit.split('');
    //   if (tsp.length > 18) {
    //     var tit = tit.slice(0, 18) + '...';
    //   }
    //   var use = that.data.gourmet.address;
    //   var acr = that.data.gourmet.address;
    //   var acp = acr.replace(/\n\n/g, '');
    //   var acs = acp.split('');
    //   var acm = '';
    //   var row = [];
    //   for (var a = 0; a < acs.length; a++) {
    //     if (ctx.measureText(acm).width < 320) {
    //       acm += acs[a];
    //     } else {
    //       a--;
    //       row.push(acm);
    //       acm = '';
    //     }
    //   }
    //   row.push(acm);

    //   wx.getImageInfo({
    //     src:"";
    //     success: function success(res) {
    //       ctx.setFillStyle('#ffffff');
    //       ctx.fillRect(0, 0, 400, 800);
    //       ctx.drawImage('../../imgs/logo_share.png', 20, 30, 80, 80);
    //       // ctx.setFillStyle('#333333');
    //       // ctx.setFontSize(18);
    //       // ctx.fillText('小独', 108, 63);
    //       // ctx.setFillStyle('#999999');
    //       // ctx.setFontSize(14);
    //       // ctx.fillText('溺于安宁，独伴时光', 108, 92);
    //       // ctx.strokeStyle = "#eee";
    //       // ctx.lineWidth = 0.5;
    //       // ctx.beginPath();
    //       // ctx.moveTo(20, 130);
    //       // ctx.lineTo(380, 130);
    //       // ctx.stroke();
    //       // ctx.drawImage(res.path, 20, 145, 360, 180);
    //       // ctx.setFillStyle('#333333');
    //       // ctx.setFontSize(18);
    //       // ctx.fillText(tit, 20, 355);
    //       // ctx.setFillStyle('#999999');
    //       // ctx.setFontSize(13);
    //       // ctx.fillText(use, 20, 380);
    //       // ctx.setFillStyle('#666666');
    //       // ctx.setFontSize(15);
    //       // if (row.length > 4) {
    //       //   var rowCut = row.slice(0, 4);
    //       //   var rowPart = rowCut[1];
    //       //   var test = '';
    //       //   var empty = [];
    //       //   for (var a = 0; a < rowPart.length; a++) {
    //       //     if (ctx.measureText(test).width < 300) {
    //       //       test += rowPart[a];
    //       //     } else {
    //       //       break;
    //       //     }
    //       //   }
    //       //   empty.push(test);
    //       //   var group = empty[0] + ".......";
    //       //   rowCut.splice(4, 1, group);
    //       //   row = rowCut;
    //       // }
    //       // for (var b = 0; b < row.length; b++) {
    //       //   ctx.fillText(row[b], 20, 410 + b * 30, 360);
    //       // }
    //       ctx.strokeStyle = "#eee";
    //       ctx.lineWidth = 0.5;
    //       ctx.beginPath();
    //       ctx.moveTo(20, 550);
    //       ctx.lineTo(380, 550);
    //       ctx.stroke();
    //       ctx.drawImage('../../imgs/logo_qrcode.png', 240, 565, 120, 120);
    //       // ctx.setFillStyle('#333333');
    //       // ctx.setFontSize(40);
    //       // ctx.fillText(dat, 50, 636);
    //       // ctx.setFontSize(22);
    //       // ctx.fillText(mon + '.' + yer, 96, 636);
    //       ctx.save();
    //       ctx.draw();
    //       console.log(ctx);
    //       setTimeout(function () {

    //         wx.canvasToTempFilePath({
    //           x: 0,
    //           y: 0,
    //           width: 400,
    //           height: 700,
    //           canvasId: 'shareCanvas',
    //           success: function success(res) {
    //             console.log("hi");
    //             wx.hideLoading();
    //             wx.previewImage({
    //               urls: [res.tempFilePath]
    //             });
    //             setTimeout(function () {
    //               wx.saveImageToPhotosAlbum({
    //                 filePath: res.tempFilePath,
    //                 success: function success(res) {
    //                   wx.showToast({
    //                     title: '\u4FDD\u5B58\u6210\u529F',
    //                     icon: 'none',
    //                     duration: 2000
    //                   });
    //                 }
    //               });
    //             }, 200);
    //           }
    //         });
    //       }, 500);
    //     }
    //   });
    // }

    ,
  getShareSentencTap: function getShareSentencTap() {
      var that = this;
      wx.showLoading({
        title: '\u751F\u6210\u56FE\u7247\u4E2D',
        mask: true
      });
      var ctx = wx.createCanvasContext('shareCanvas');
      ctx.setFillStyle('#ffffff');
      ctx.fillRect(0, 0, 400, 580);
      // ctx.drawImage('../../imgs/logo_share.png', 20, 30, 80, 80);
      ctx.stroke();
      //ctx.drawImage('../../imgs/logo_qrcode.png', 240, 435, 120, 120);
      ctx.save();
      ctx.draw();
      setTimeout(function() {
        wx.canvasToTempFilePath({
          x: 0,
          y: 0,
          width: 400,
          height: 580,
          canvasId: 'shareCanvas',
          success: function success(res) {
            wx.hideLoading();
            wx.previewImage({
              urls: [res.tempFilePath]
            });
            setTimeout(function() {
              wx.saveImageToPhotosAlbum({
                filePath: res.tempFilePath,
                success: function success(res) {
                  wx.showToast({
                    title: 'a',
                    icon: 'none',
                    duration: 2000
                  });
                }
              });
            }, 200);
          }
        });
      }, 500);
    }



    //addUnsupport
    ,
  addUnsupport: function() {
    var that = this;
    if (!mIsSupportOk) return;
    if (!that.data.gourmet) return;
    API.addEvaluation(that.data.gourmet.objectId, false);
    var newNumber = that.data.gourmet.objection + 1;
    that.data.gourmet.objection = newNumber;
    that.setData({
      gourmet: that.data.gourmet
    })
    toggleSupport(that, false)
    mIsSupportOk = false;

  }
})


//添加评论-到新的表
function addComment(gourmet_id, userinfo, content, cb) {
  //创建类和实例
  var Comment = Bmob.Object.extend("comment");
  var comment = new Comment();
  comment.set("gourmet_id", gourmet_id);
  comment.set("openid", userinfo.openid);
  comment.set("avatar", userinfo.avatarUrl);
  comment.set("nickname", userinfo.nickName);
  comment.set("content", content);
  comment.set("create_time", utils.getNowTimestamp());
  comment.set("create_time_tag", utils.timestamp2date(utils.getNowTimestamp() * 1000));
  //添加数据，第一个入口参数是null
  comment.save(null, {
    success: function(result) {
      console.log("创建新表评论成功, objectId:" + result.id);
      cb(true, result);
    },
    error: function(result, error) {
      // 添加失败
      console.log('创建新表评论失败');
      cb(false);
    }
  });
}

function loadFirstPage(that) {
  mPage = 1;
  getComments(mPage, function(comments) {
    mComments = comments;
    if (comments.length > 0) {
      mIsmore = true;
      that.setData({
        comments: mComments,
        hide_loadmore: false
      })
    }
  })
}