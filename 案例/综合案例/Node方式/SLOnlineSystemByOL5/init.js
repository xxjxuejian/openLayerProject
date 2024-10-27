//导入ol模块
import 'ol/ol.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import {getWidth,getTopLeft} from "ol/extent";
import {get} from "ol/proj";
import Overlay from 'ol/Overlay';
import LayerGroup from 'ol/layer/Group';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import Icon from 'ol/style/Icon';
import LineString from 'ol/geom/LineString';
import Circle from 'ol/geom/Circle';
import Polygon from 'ol/geom/Polygon';
import GeoJSON from 'ol/format/GeoJSON.js';

//定义变量
//各表格
var Table_shuiqing;
var Table_taifeng;
var Table_yqYlxx;
var Table_yqGszdyl;
var Table_yqLjtj;
var Table_taifenglujing;
//查询的数据信息
var sqsk_InfoArray;
var sqhl_InfoArray;
var Ssyq_InfoArray;
var tfPathInfo;
//地图对象
var map;
//图层组
var LayerArr;
//矢量、影像、地形图层
var vecLayer, imgLayer, terLayer;
//注记图层
var vecZjLayer, imgZjLayer, terZjLayer;
//边界线图层
var boundaryVectorLayer;
//popup元素
var PopopOverlay;
var popupElement;
var popupClose;
//查询雨量为100的数据
var minRain = 50;
var maxRain = 99.91;
var times = "2008-05-16";
var timee = "2008-05-16";
var timeS = " 08:00:00";
var timeE = " 17:00:00";
var s = times + timeS;
var e = timee + timeE;
//echart图表
var myChart;
//鼠标移动至的要素类型
var movetype;
//鼠标选中的前一要素
var preFeature = null;  

!(function () {
    //如果是ie11以下，则不加载页面
    if (isIE()) {
        alert("不支持IE低版本浏览器，请使用IE11或其他浏览器！");
        //阻止页面加载
        window.stop ? window.stop() : document.execCommand("Stop");
        return;
    }
})()

/**
* 初始化函数
* @author zjh 2018-08-23
*/
window.onload = function () {
    //初始化水库table
    var oTable_sk = new Table_shuiqing("tb_shuiku");
    oTable_sk.Init();
    //初始化河流table
    var oTable_hl = new Table_shuiqing("tb_heliu");
    oTable_hl.Init();
    //初始化雨情-雨量信息table
    var oTable_ylxx = new Table_yqYlxx();
    oTable_ylxx.Init();
    //初始化雨情-最大雨量table
    var oTable_gszdyl = new Table_yqGszdyl();
    oTable_gszdyl.Init();
    //初始化雨情-雨量统计table
    var oTable_ljtj = new Table_yqLjtj();
    oTable_ljtj.Init();
    //初始化台风基本信息table
    var oTable_tf = new Table_taifeng();
    oTable_tf.Init();
    //初始化台风详细路径table
    var oTable_tflj = new Table_taifenglujing();
    oTable_tflj.Init();

    //地图中心点
    var center = [12308196.042592192, 2719935.2144997073];
    //获取图层（天地图）
    addBaseLayer();
    //创建地图对象
    map = new Map({
        //添加图层
        //layers: [vecLayer, vecZjLayer],
        //目标DIV
        target: 'map',
        view: new View({
            //投影坐标系
            projection: get('EPSG:3857'), 
            center: center,
            maxZoom: 16,
            minZoom: 2,
            zoom: 6
        })
    });
    map.addLayer(vecLayer);
    map.addLayer(vecZjLayer);
    /**
    * 为map添加点击事件监听，渲染弹出popup
    */
    map.on('singleclick', function (evt) {
        var coordinate = evt.coordinate;
        //判断当前单击处是否有要素，捕获到要素时弹出popup
        var feature1 = map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) { return feature; });
        if (feature1) {
            var type = feature1.get('type');
            var info = feature1.get('info');
            if (type == "river") {
                //水情-河流 Popup
                showSssqPopup(info, "river");
            }
            if (type == "Rver") {
                //水情-河流 Rver
                showSssqPopup(info, "Rver");
            }
            if (type == "sq") {
                //为雨情要素点添加popup的信息内容
                showSsyqPopup(info);
            }
            if (type == "typhoon") {
                //台风popup
                showTfljPopup(info);
            }
            else {
                return;
            }
        }
    });

    /**
    * 为map添加move事件监听，变更图标大小实现选中要素的动态效果
    */
    map.on('pointermove', function (evt) {
        var pixel = map.getEventPixel(evt.originalEvent);
        var hit = map.hasFeatureAtPixel(pixel);
        map.getTargetElement().style.cursor = hit ? 'pointer' : '';

        var coordinate = evt.coordinate;
        //判断当前鼠标悬停位置处是否有要素，捕获到要素时设置图标样式
        var feature = map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) { return feature; });
        
        if (feature) {

            movetype = feature.get('type');
            if ((movetype == undefined) || (movetype == "tfMarker") || (movetype == "tfCircle")) {
                return;
            }
            //鼠标移动到台风标注时，显示tooltip
            if (movetype == "typhoon") {
                var info = feature.get('info');
                showTfljPopup(info);
            }
            if ((preFeature != null) && (preFeature !== feature)) { //如果当前选中要素与前一选中要素不同，恢复前一要素样式，放大当前要素图标
                var curImgURL = feature.get('imgURL');
                var preImgURL = preFeature.get('imgURL');
                feature.setStyle(createLabelStyle(curImgURL, 1.2));
                preFeature.setStyle(createLabelStyle(preImgURL, 0.8));
                preFeature = feature;
            }
            if (preFeature == null) { //如果前一选中要素为空，即当前选中要素为首次选中要素，放大当前要素图标
                var curImgURL = feature.get('imgURL');
                feature.setStyle(createLabelStyle(curImgURL, 1.2));
                preFeature = feature;
            }
        }
        else {
            if (preFeature != null) { //如果鼠标移出前一要素，恢复要素图标样式
                var imgURL = preFeature.get('imgURL');
                preFeature.setStyle(createLabelStyle(imgURL, 0.8));
                preFeature = null;
                if (movetype == "typhoon") {
                    PopopOverlay.setPosition(undefined);
                }
            }
        }
    });

    //获取popup的容器
    var container = document.getElementById('popup');
    //在地图容器中创建一个Overlay
    PopopOverlay = new Overlay(({
        element: container,
        autoPan: true
    }));
    map.addOverlay(PopopOverlay);

    popupClose = $("#popup-closer");
    /**
    * 添加关闭按钮的单击事件（隐藏popup）
    * @return {boolean} Don't follow the href.
    */
    popupClose.bind("click", function () {
        PopopOverlay.setPosition(undefined);  //未定义popup位置
        popupClose.blur(); //失去焦点

    });

    // 初始化卫星云图对话框
    $("#dialog").dialog({
        modal: true,  // 创建模式对话框
        autoOpen: false, //默认隐藏对话框
        height: 590,
        width: 920,
        minWidth: 920,
        minHeight: 590,
        open: function (event, ui) {
            $("#wxytIframe").attr("src", "newYunTu.htm"); //打开对话框时加载卫星云图功能页面
        },
        close: function (event, ui) {
            $('#cbox_wxyt').attr('checked', false); //关闭对话框时不选中【卫星云图】功能项
        }
    });
    //给卫星云图添加关闭按钮的样式
    $(".ui-dialog-titlebar-close").addClass("ui-button");
    $(".ui-dialog-titlebar-close").addClass("ui-widget");
    $(".ui-dialog-titlebar-close").addClass("ui-state-default");
    $(".ui-dialog-titlebar-close").addClass("ui-corner-all");
    $(".ui-dialog-titlebar-close").addClass("ui-button-icon-only");
    $(".ui-dialog-titlebar-close").append('<span class="ui-button-icon-primary ui-icon ui-icon-closethick"></span>');
    //定义坐标数组
    var finaldots = new Array();
    //获取图形边界范围
    $.getJSON("data/data.json", function (data) {
        //获取json数据
        var boundary = data[0].boundary;
        var result = boundary.split(",");
        for (var i = 0; i < result.length; i++) {
            //按照空格分隔字符串
            var dot = result[i].split(" ");
            var mktdot = lonLat2Mercator(parseFloat(dot[0]), parseFloat(dot[1]));
            //将坐标存入结果数组
            finaldots.push([mktdot.x, mktdot.y]);   
        }
        var styles = [
            new Style({
                //边线颜色
                stroke: new Stroke({
                    color: '#ffcc33',
                    width: 2
                })
            })
        ];
        var geojsonObject = {
            'type': 'FeatureCollection',
            'features': [{
                'type': 'Feature',
                'geometry': {
                    'type': 'Polygon',
                    'coordinates': [finaldots]
                }
            }]
        };
        //实例化一个矢量图层Vector作为绘制层
        var source = new VectorSource({
            features: (new GeoJSON()).readFeatures(geojsonObject)
        });
        //创建一个图层
        boundaryVectorLayer = new VectorLayer({
            source: source,
            style:styles
        });
        //将绘制层添加到地图容器中
        map.addLayer(boundaryVectorLayer);
    });

}

/**
* 底图切换
* @param {int} index 底图索引
*/
function changeLayer(index) {  
    //获取所选底图的索引
    var layerIndex= parseFloat(index);
    //从地图中取图层组
    var group = map.getLayerGroup();
    //0索引为底图，将底图换成新的底图
    group.values_.layers.array_[0] = LayerArr[layerIndex];
    group.values_.layers.array_[1] = LayerArr[layerIndex + 3];
    //将图层组重新设置到map
    map.setLayerGroup(group);
    //刷新地图，不可省，否则无法看到变更后的底图
    map.renderSync();   
}

//监听底图切换按钮点击事件
$(".baselayer").on("click",function(){
    var index= $(this).attr("id");
    //根据索引切换底图
    changeLayer(index);
})

/**
* 判断是否为低版本ie浏览器
* @author zjh 2018-08-23
*/
function isIE() {
    if (!!window.ActiveXObject || "ActiveXObject" in window)
        return true;
    else
        return false;
}

/**
* WGS-84 转 web墨卡托，主要用于将坐标单位为度的值转为单位为米的值
* @param {double} lon 经度
* @param {double} lat 纬度
* @author zjh 2018-08-23
*/
function lonLat2Mercator(lon, lat) {
    var x = lon * 20037508.34 / 180;
    var y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / Math.PI * 20037508.34;
    y = Math.max(-20037508.34, Math.min(y, 20037508.34));
    return { 'x': x, 'y': y };
}

/**
* web墨卡托 转 WGS-84，主要用于将坐标单位为米的值转为单位为度的值
* @param {double} mercatorX X坐标
* @param {double} mercatorY Y坐标
* @author zjh 2018-08-23
*/
function mercator2LonLat(mercatorX, mercatorY) {
    var lon = mercatorX * 180 / 20037508.34;
    var lat = 180 / Math.PI * (2 * Math.atan(Math.exp((mercatorY / 20037508.34) * Math.PI)) - Math.PI / 2);
    return { 'x': lon, 'y': lat };
}

/*
* 根据基地址创建天地图图层
* @param {string} baseurl 天地图图层基地址
* @author zjh 2019-01-16
*/
function CreteTDTLayer(baseurl) {
    //初始化天地图矢量图层
    var layer = new TileLayer ({
        //设置图层透明度
        opacity: 1,
        //数据源
        source: new XYZ ({
            url:baseurl
        })          
    })
    //返回layer
    return layer;
}

/*
* 加载天地图图层
* @author zjh 2019-01-16
*/
function addBaseLayer() {
    //矢量图层
    vecLayer = CreteTDTLayer("http://t0.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=55b4d4eaef95384c946e9bd1b99c5610");
    //影像图层
    imgLayer = CreteTDTLayer("http://t0.tianditu.com/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=55b4d4eaef95384c946e9bd1b99c5610");
    //地形图层
    terLayer = CreteTDTLayer("http://t0.tianditu.com/DataServer?T=ter_w&x={x}&y={y}&l={z}&tk=55b4d4eaef95384c946e9bd1b99c5610");
    //矢量注记图层
    vecZjLayer = CreteTDTLayer("http://t0.tianditu.com/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=55b4d4eaef95384c946e9bd1b99c5610");
    //影像注记图层
    imgZjLayer = CreteTDTLayer("http://t0.tianditu.com/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=55b4d4eaef95384c946e9bd1b99c5610");
    //地形注记图层
    terZjLayer = CreteTDTLayer("http://t0.tianditu.com/DataServer?T=cta_w&x={x}&y={y}&l={z}&tk=55b4d4eaef95384c946e9bd1b99c5610");
    //图层组
    LayerArr = [vecLayer, imgLayer, terLayer, vecZjLayer, imgZjLayer, terZjLayer];
}

//创建表格
//////==========================================================================
//创建水情表格
Table_shuiqing = function (nameid) {
    var oTableInit = new Object();
    var type;
    if (nameid == "tb_shuiku") {
        type = "Rver";
    }
    if (nameid == "tb_heliu") {
        type = "river";
    }
    //初始化Table
    oTableInit.Init = function () {
        $('#' + nameid).bootstrapTable({
            toolbar: '#toolbar',                //工具按钮用哪个容器
            method: 'get',                      //请求方式（*）
            url: encodeURI("Handler.ashx?method=sssq&oper=waterInfo&type=" + type), //请求后台的URL（*） -->
            dataType: 'json',
            cache: false,
            striped: true,                       //是否显示行间隔色
            sidePagination: "client",           //分页方式：client客户端分页，server服务端分页（*）
            showColumns: true,
            sortable: true,                     //是否启用排序
            sortClass: "id",                   //排序方式
            sortName: '序号',
            sortOrder: "desc",                   //排序方式
            minimumCountColumns: 2,
            pagination: true,
            pageNumber: 1,                       //初始化加载第一页，默认第一页
            pageSize: 7,                       //每页的记录行数（*）
            pageList: [7],        //可供选择的每页的行数（*）
            uniqueId: "id",                     //每一行的唯一标识，一般为主键列
            showExport: true,
            exportDataType: 'all',
            search: true,                    //是否显示查询面板
            showColumns: false,                  //是否显示所有的列
            showRefresh: false,                  //是否显示刷新按钮
            showToggle: false,                    //是否显示详细视图和列表视图的切换按钮
            minimumCountColumns: 2,             //最少允许的列数
            clickToSelect: true,                //是否启用点击选中行
            //行高，如果没有设置height属性，表格自动根据记录条数觉得表格高度
            uniqueId: "ID",                     //每一行的唯一标识，一般为主键列
            cardView: false,                    //是否显示详细视图
            detailView: false,                   //是否显示父子表
            responseHandler: oTableInit.responseHandler, //ajax已请求到数据，表格加载数据之前调用函数

            columns: [{
                checkbox: false,
                visible: false
            }, {
                field: 'no',
                title: '序号',
                sortable: true,
                formatter: function (value, row, index) {
                    //获取每页显示的数量
                    var pageSize = $('#tb_shuiku').bootstrapTable('getOptions').pageSize;
                    //获取当前是第几页
                    var pageNumber = $('#tb_shuiku').bootstrapTable('getOptions').pageNumber;
                    //返回序号，注意index是从0开始的，所以要加上1
                    return index + 1;
                }
            },

                    {
                        field: 'SiteName',
                        title: '站名',
                        class: 'w70'


                    }, {
                        field: 'SiteNum',
                        title: '站码',
                        class: 'w70'

                    }, {
                        field: 'WaterPos',
                        title: '水位',
                        class: 'w60'
                    },
                        {
                            field: 'WarnNum',
                            title: '警戒/汛眼',
                            class: 'w90'

                        },
                 {
                     field: 'NorNum',
                     title: '保证/正常高',
                     class: 'w90'
                 },
                  {
                      field: 'FlowNum',
                      title: '流量',
                      class: 'w60'
                  },
                  {
                      field: 'tm',
                      title: '时间',
                      class: 'w120'
                  },
                   {
                       field: 'SiteAddress',
                       title: '地址',
                       class: 'w200'
                   }],

            onClickRow: function (row, element) {
                $(".success").removeClass('success');
                $(element).addClass('success'); //添加当前选中的 success样式用于区别
                //                $(element).css("background-color", "#3F8BCA");
                var coordinate = [parseFloat(row.SitePntX), parseFloat(row.SitePntY)]; //获取要素点坐标
                map.getView().setZoom(7);
                map.getView().setCenter(coordinate); //设置地图中心点
                map.once("moveend", function () {
                    if (nameid == "tb_shuiku") {
                        showSssqPopup(row, "Rver");
                    }
                    if (nameid == "tb_heliu") {
                        showSssqPopup(row, "river");
                    }
                });
            }
        });

    };

    //加载服务器数据之前的处理程序
    oTableInit.responseHandler = function (res) {
        var temp = {
            "rows": [],
            "total": 0
        };
        if (!!res) {
            if (res.code == '1') {
                temp.rows = JSON.parse(res.list);
                temp.total = parseInt(res.total);
            }
        }
        if (nameid == "tb_shuiku") {
            sqsk_InfoArray = res;
        }
        if (nameid == "tb_heliu") {
            sqhl_InfoArray = res;

        }
        return res;
    };
    return oTableInit;
}

//雨情_雨量信息
Table_yqYlxx = function () {

    var oTableInit = new Object();
    //初始化Table
    oTableInit.Init = function () {
        $('#tb_infoYlxx').bootstrapTable({
            method: 'get',                      //请求方式（*）
            url: encodeURI("Handler.ashx?method=ssyq&oper=rainNum&s=" + s + "&e=" + e + "&minRain=" + minRain + "&maxRain=" + maxRain), //请求后台的URL（*） -->
            dataType: 'json',
            cache: false,
            striped: true,                       //是否显示行间隔色
            sidePagination: "client",           //分页方式：client客户端分页，server服务端分页（*）
            showColumns: true,
            sortable: true,                     //是否启用排序
            sortClass: "id",                   //排序方式
            sortName: '序号',
            sortOrder: "desc",                   //排序方式
            minimumCountColumns: 2,
            pagination: true,
            pageNumber: 1,                       //初始化加载第一页，默认第一页
            pageSize: 5,                       //每页的记录行数（*）
            pageList: [5],        //可供选择的每页的行数（*）
            search: false,                    //是否显示查询面板
            uniqueId: "id",                     //每一行的唯一标识，一般为主键列
            showExport: true,
            exportDataType: 'all',

            showColumns: false,                  //是否显示所有的列
            showRefresh: false,                  //是否显示刷新按钮
            minimumCountColumns: 2,             //最少允许的列数
            clickToSelect: true,                //是否启用点击选中行
            //行高，如果没有设置height属性，表格自动根据记录条数觉得表格高度
            uniqueId: "ID",                     //每一行的唯一标识，一般为主键列
            showToggle: false,                    //是否显示详细视图和列表视图的切换按钮
            cardView: false,                    //是否显示详细视图
            detailView: false,                   //是否显示父子表

            responseHandler: oTableInit.responseHandler, //ajax已请求到数据，表格加载数据之前调用函数
            columns: [{
                checkbox: false,
                visible: false
            }, {
                field: 'no',
                title: '序号',
                //                class: 'w70',
                sortable: true,
                formatter: function (value, row, index) {
                    //获取每页显示的数量
                    var pageSize = $('#tb_infoYlxx').bootstrapTable('getOptions').pageSize;
                    //获取当前是第几页
                    var pageNumber = $('#tb_infoYlxx').bootstrapTable('getOptions').pageNumber;
                    //返回序号，注意index是从0开始的，所以要加上1
                    return index + 1;
                }
            }, {
                field: 'SiteName',
                title: '站名',
                class: 'w70'

            }, {
                field: 'SiteNum',
                title: '站码',
                class: 'w80'
            },

                   {
                       field: 'RainNum',
                       title: '雨量',
                       class: 'w60'
                   },
                    {
                        field: 'SiteAddress',
                        title: '站址',
                        class: 'w220'
                    }

            ],
            onClickRow: function (row, element) {
                $(".success").removeClass('success');
                $(element).addClass('success'); //添加当前选中的 success样式用于区别
                var coordinate = [parseFloat(row.SitePntX), parseFloat(row.SitePntY)]; //获取要素点坐标

                map.getView().setCenter(coordinate); //设置地图中心点
                map.once("moveend", function () {
                    showSsyqPopup(row);
                });
            }

        });

    };

    //加载服务器数据之前的处理程序
    oTableInit.responseHandler = function (res) {
        var temp = {
            "rows": [],
            "total": 0
        };
        if (!!res) {
            if (res.code == '1') {
                temp.rows = JSON.parse(res.list);
                temp.total = parseInt(res.total);
            }
        }
        Ssyq_InfoArray = res;
        return res;
    };

    return oTableInit;
};

//雨情_各市最大雨量
Table_yqGszdyl = function () {

    var oTableInit = new Object();
    //初始化Table
    oTableInit.Init = function () {
        $('#tb_infoGszdyl').bootstrapTable({
            //                    toolbar: '',                //工具按钮用哪个容器
            method: 'get',                      //请求方式（*）
            url: encodeURI("Handler.ashx?method=ssyq&oper=rainNum&s=" + s + "&e=" + e + "&minRain=" + minRain + "&maxRain=" + maxRain), //请求后台的URL（*） -->
            dataType: 'json',

            cache: false,
            striped: true,                       //是否显示行间隔色
            sidePagination: "client",           //分页方式：client客户端分页，server服务端分页（*）
            showColumns: true,
            sortable: true,                     //是否启用排序
            sortClass: "id",                   //排序方式
            sortName: '序号',
            sortOrder: "desc",                   //排序方式
            minimumCountColumns: 2,
            pagination: true,
            pageNumber: 1,                       //初始化加载第一页，默认第一页
            pageSize: 5,                       //每页的记录行数（*）
            pageList: [5],        //可供选择的每页的行数（*）
            search: false,                    //是否显示查询面板
            uniqueId: "id",                     //每一行的唯一标识，一般为主键列
            showExport: true,
            exportDataType: 'all',

            showColumns: false,                  //是否显示所有的列
            showRefresh: false,                  //是否显示刷新按钮
            minimumCountColumns: 2,             //最少允许的列数
            clickToSelect: true,                //是否启用点击选中行
            //行高，如果没有设置height属性，表格自动根据记录条数觉得表格高度
            uniqueId: "ID",                     //每一行的唯一标识，一般为主键列
            showToggle: false,                    //是否显示详细视图和列表视图的切换按钮
            cardView: false,                    //是否显示详细视图
            detailView: false,                   //是否显示父子表
            responseHandler: oTableInit.responseHandler, //ajax已请求到数据，表格加载数据之前调用函数
            columns: [{
                checkbox: false,
                visible: false
            }, {
                field: 'no',
                title: '序号',
                sortable: true,
                formatter: function (value, row, index) {
                    //获取每页显示的数量
                    var pageSize = $('#tb_infoYlxx').bootstrapTable('getOptions').pageSize;
                    //获取当前是第几页
                    var pageNumber = $('#tb_infoYlxx').bootstrapTable('getOptions').pageNumber;
                    //返回序号，注意index是从0开始的，所以要加上1
                    return index + 1;
                }
            }, {
                field: 'Pro',
                title: '城市',
                class: 'w60'

            }, {
                field: 'SiteName',
                title: '地区',
                class: 'w60'
            },

                   {
                       field: 'RainNum',
                       title: '最大雨量',
                       class: 'w70'
                   }

            ]

        });

    };

    //加载服务器数据之前的处理程序
    oTableInit.responseHandler = function (res) {
        var temp = {
            "rows": [],
            "total": 0
        };
        if (!!res) {
            if (res.code == '1') {
                temp.rows = JSON.parse(res.list);
                temp.total = parseInt(res.total);
            }
        }
        return res;
    };


    return oTableInit;
};

//雨情_量级统计
Table_yqLjtj = function () {
    var oTableInit = new Object();
    //初始化Table
    oTableInit.Init = function () {
        $('#tb_infoLjtj').bootstrapTable({
            method: 'get',                      //请求方式（*）

            dataType: 'json',
            cache: false,
            striped: true,                       //是否显示行间隔色
            sidePagination: "client",           //分页方式：client客户端分页，server服务端分页（*）
            showColumns: true,
            sortable: true,                     //是否启用排序
            sortClass: "id",                   //排序方式
            sortName: '序号',
            sortOrder: "desc",                   //排序方式
            minimumCountColumns: 2,
            pagination: true,
            pageNumber: 1,                       //初始化加载第一页，默认第一页
            pageSize: 6,                       //每页的记录行数（*）
            pageList: [6],        //可供选择的每页的行数（*）
            search: false,                    //是否显示查询面板
            uniqueId: "id",                     //每一行的唯一标识，一般为主键列
            showExport: true,
            exportDataType: 'all',

            showColumns: false,                  //是否显示所有的列
            showRefresh: false,                  //是否显示刷新按钮
            minimumCountColumns: 2,             //最少允许的列数
            clickToSelect: true,                //是否启用点击选中行
            //行高，如果没有设置height属性，表格自动根据记录条数觉得表格高度
            uniqueId: "ID",                     //每一行的唯一标识，一般为主键列
            showToggle: false,                    //是否显示详细视图和列表视图的切换按钮
            cardView: false,                    //是否显示详细视图
            detailView: false,                   //是否显示父子表
            //queryParams: oTableInit.queryParams, //传递参数（*）
            queryParamsType: '',
            responseHandler: oTableInit.responseHandler, //ajax已请求到数据，表格加载数据之前调用函数
            data: [{
                "Extend": "小于10",
                "SiteNum": "0"
            },
                   {
                       "Extend": "[10,25)",
                       "SiteNum": "0"
                   },
                   {
                       "Extend": "[25,50)",
                       "SiteNum": "0"
                   },
                    {
                        "Extend": "[50,100)",
                        "SiteNum": "5"
                    },
                     {
                         "Extend": "[100,250)",
                         "SiteNum": "0"
                     },
                     {
                         "Extend": "250以上",
                         "SiteNum": "0"
                     }
            ],

            columns: [{
                checkbox: false,
                visible: false
            }, {
                field: 'Extend',
                title: '雨量范围（mm）',
                class: 'w120'

            }, {
                field: 'SiteNum',
                title: '区县数',
                class: 'w80'
            }
            ]

        });

    };

    //加载服务器数据之前的处理程序
    oTableInit.responseHandler = function (res) {
        var temp = {
            "rows": [],
            "total": 0
        };
        if (!!res) {
            if (res.code == '1') {
                temp.rows = JSON.parse(res.list);
                temp.total = parseInt(res.total);
            }
        }
        return res;
    };
    return oTableInit;
};

//台风
Table_taifeng = function () {
    var oTableInit = new Object();
    //初始化Table
    oTableInit.Init = function () {
        $('#tb_taifeng').bootstrapTable({
            //                    toolbar: '',                //工具按钮用哪个容器
            method: 'get',                      //请求方式（*）
            url: encodeURI("Handler.ashx?method=tflj&oper=tfInfo"), //请求后台的URL（*） -->
            dataType: 'json',

            cache: false,
            striped: true,                       //是否显示行间隔色
            sidePagination: "client",           //分页方式：client客户端分页，server服务端分页（*）
            showColumns: true,
            sortable: true,                     //是否启用排序
            sortClass: "id",                   //排序方式
            sortName: '序号',
            sortOrder: "desc",                   //排序方式
            minimumCountColumns: 2,
            pagination: false,
            pageNumber: 1,                       //初始化加载第一页，默认第一页
            pageSize: 5,                       //每页的记录行数（*）
            pageList: [5, 15, 20, 25],        //可供选择的每页的行数（*）
            search: false,                    //是否显示查询面板
            uniqueId: "id",                     //每一行的唯一标识，一般为主键列
            showExport: true,
            exportDataType: 'all',

            showColumns: false,                  //是否显示所有的列
            showRefresh: false,                  //是否显示刷新按钮
            minimumCountColumns: 2,             //最少允许的列数
            clickToSelect: true,                //是否启用点击选中行
            //行高，如果没有设置height属性，表格自动根据记录条数觉得表格高度
            uniqueId: "ID",                     //每一行的唯一标识，一般为主键列
            showToggle: false,                    //是否显示详细视图和列表视图的切换按钮
            cardView: false,                    //是否显示详细视图
            detailView: false,                   //是否显示父子表
            columns: [{
                checkbox: true,
                visible: true
            }, {
                field: 'windid',
                title: '台风编号',
                class: 'w80'

            }, {
                field: 'windname',
                title: '台风名',
                class: 'w80'
            }, {
                field: 'windeng',
                title: '英文名',
                class: 'w80'
            }
            ],
            onCheck: function (row) {
                $("#taifeng_lujing").css("display", "block");
                $(".tflj_label").css("display", "block");
                //查询台风预测信息
                var urlStr = encodeURI("Handler.ashx?method=tflj&oper=forcastInfo&tfID=" + "200813");
                $.ajax({
                    type: "get",
                    contentType: "application/json",
                    url: urlStr,
                    async: false,
                    success: tfljForcastOnsuccess
                });
                tfDetailInfoArray = tfPathInfo;
                drawTFPathInfo(tfPathInfo);
                PopopOverlay.setPosition(undefined);
            },
            onUncheck: function () {
                $("#taifeng_lujing").css("display", "none");
                $(".tflj_label").css("display", "none");
                //清除台风路径
                clearTfljMarker();
                clearTfljPath();
                clearTimer();
                clearTFCurrentCircle();
                PopopOverlay.setPosition(undefined);
            }
        });
    };

    return oTableInit;
};

//台风路径
Table_taifenglujing = function () {
    var oTableInit = new Object();

    //初始化Table
    oTableInit.Init = function () {
        $('#tb_taifenglujing').bootstrapTable({
            method: 'get',                      //请求方式（*）
            url: encodeURI("Handler.ashx?method=tflj&oper=detailInfo&tfID=" + "200813"), //请求后台的URL（*） -->
            dataType: 'json',
            cache: false,
            striped: true,                       //是否显示行间隔色
            sidePagination: "client",           //分页方式：client客户端分页，server服务端分页（*）
            showColumns: true,
            sortable: true,                     //是否启用排序
            sortClass: "id",                   //排序方式
            sortName: '序号',
            sortOrder: "desc",                   //排序方式
            minimumCountColumns: 2,
            pagination: true,
            pageNumber: 1,                       //初始化加载第一页，默认第一页
            pageSize: 4,                       //每页的记录行数（*）
            pageList: [4],        //可供选择的每页的行数（*）
            search: false,                    //是否显示查询面板
            uniqueId: "id",                     //每一行的唯一标识，一般为主键列
            showExport: true,
            exportDataType: 'all',
            showColumns: false,                  //是否显示所有的列
            showRefresh: false,                  //是否显示刷新按钮
            minimumCountColumns: 2,             //最少允许的列数
            clickToSelect: true,                //是否启用点击选中行
            //行高，如果没有设置height属性，表格自动根据记录条数觉得表格高度
            uniqueId: "ID",                     //每一行的唯一标识，一般为主键列
            showToggle: false,                    //是否显示详细视图和列表视图的切换按钮
            cardView: false,                    //是否显示详细视图
            detailView: false,                   //是否显示父子表
            responseHandler: oTableInit.responseHandler, //ajax已请求到数据，表格加载数据之前调用函数
            columns: [{
                checkbox: false,
                visible: false
            }, {
                field: 'tm',
                title: '时间',
                class: 'w160'

            }, {
                field: 'windstrong',
                title: '风力',
                class: 'w60'
            },{
                field: 'windspeed',
                title: '风速',
                class: 'w60'
            }
            ],
            onClickRow: function (row, element) {
                $(".success").removeClass('success');
                $(element).addClass('success'); //添加当前选中的 success样式用于区别
                //获取要素点坐标
                var coordinate = [parseFloat(row.jindu), parseFloat(row.weidu)]; 
                //设置地图中心点
                map.getView().setCenter(coordinate); 
                map.once("moveend", function () {
                    showTfljPopup(row);
                });
            }
        });
    };

    //加载服务器数据之前的处理程序
    oTableInit.responseHandler = function (res) {
        tfPathInfo = res;
        return res;
    };
    return oTableInit;
};




////////============================================================================================

/*
*@author zjh 2018-08-09 水情表格面板控制
*/
$("#cbox_sq").on("change",function(){
    var cbox_state = $("#cbox_sq").is(":checked");
    if (cbox_state) {
        $("#resultpanel").css("display", "block");
        $("#li_sq").css("display", "block");
        //移除之前的高亮样式
        $(".tab-li").removeClass("active");
        $(".tab-pane").removeClass("active");
        //将当前所选表格置于高亮
        $("#li_sq").addClass("active");
        $("#shuiqing").addClass("active");
        if ($("#radio_sk").is(":checked")) {
            //显示水库表格
            $("#sqsk").css("display", "block");
            //加载水情—水库标注
            addWaterMarker(sqsk_InfoArray, "marker_sk");
        }
        else {
            //显示河流表格
            $("#sqhl").css("display", "block");
            //加载水情—河流标注
            addWaterMarker(sqhl_InfoArray, "marker_hl");
        }
        if ($("#legend_control_hide").css("display") != "block") {
            //显示图例
            $("#legend_control_show").css("display", "block");
        }
    }
    else {
        var haschecked = false;
        $(".cbox").each(function () {
            if (this.checked == true) {
                haschecked = true;
            }
        });
        if (!haschecked) {
            $("#resultpanel").css("display", "none");
            //关闭图例
            $("#legend_control_show").css("display", "none");
            $("#legend_control_hide").css("display", "none");
        }
        else {
            //移除之前的高亮样式
            $(".tab-li").removeClass("active");
            $(".tab-pane").removeClass("active");
            if ($("#cbox_yq").is(":checked")) {
                //雨情高亮
                $("#li_yq").addClass("active");
                $("#yuqing").addClass("active");
            }
            else {
                //台风高亮
                $("#li_tf").addClass("active");
                $("#taifeng").addClass("active");
            }
        }
        //移除当前表格
        $("#li_sq").css("display", "none");
        $("#sqsk").css("display", "none");
        $("#sqhl").css("display", "none");
        //去除行高亮背景
        $(".success").removeClass('success');
        clearSssqMarker("river");       //清除添加的标注
        clearSssqMarker("Rver");       //清除添加的标注
        map.getView().setZoom(6);
    }
    PopopOverlay.setPosition(undefined);
    $("#tb_shuiku").bootstrapTable("resetSearch");
    $("#tb_heliu").bootstrapTable("resetSearch");
})

/*
*@author zjh 2018-08-09 雨情表格面板控制
*/
$("#cbox_yq").on("change",function(){
    var cbox_state = $("#cbox_yq").is(":checked");
    if (cbox_state) {
        $("#resultpanel").css("display", "block");
        $("#li_yq").css("display", "block");
        //移除之前的高亮样式
        $(".tab-li").removeClass("active");
        $(".tab-pane").removeClass("active");
        //将当前所选表格置于高亮
        $("#li_yq").addClass("active");
        $("#yuqing").addClass("active");
        if ($("#radio_ylxx").is(":checked")) {
            //显示雨量信息表格
            $("#div_infoYlxx").css("display", "block");
        }
        else if ($("#radio_gszdyl").is(":checked")) {
            //显示雨量信息表格
            $("#div_infoGszdyl").css("display", "block");
        }
        else {
            //显示河流表格
            $("#div_infoLjtj").css("display", "block");
        }
        //加载雨情标注
        if ($(".ylxxdefault").is(':checked') && Ylxx_data.length <= 0) {
            callRainInfo(50, 99.99);
        }
        addRainMarker();

    }
    else {
        var haschecked = false;
        $(".cbox").each(function () {
            if (this.checked == true) {
                haschecked = true;
            }
        });
        if (!haschecked) {
            $("#resultpanel").css("display", "none");
            //关闭图例
            $("#legend_control_show").css("display", "none");
            $("#legend_control_hide").css("display", "none");
        }
        else {
            //移除之前的高亮样式
            $(".tab-li").removeClass("active");
            $(".tab-pane").removeClass("active");
            if ($("#cbox_sq").is(":checked")) {
                //水情高亮
                $("#li_sq").addClass("active");
                $("#shuiqing").addClass("active");
            }
            else {
                //台风高亮
                $("#li_tf").addClass("active");
                $("#taifeng").addClass("active");
            }
        }
        $("#li_yq").css("display", "none");
        $("#div_infoYlxx").css("display", "none");
        $("#div_infoGszdyl").css("display", "none");
        $("#div_infoLjtj").css("display", "none");
        //去除行高亮背景
        $(".success").removeClass('success');
        clearSsyqMarker(); //移除标注

    }
    PopopOverlay.setPosition(undefined);
})

/*
*@author zjh 2018-08-09 台风路径表格面板控制
*/
$("#cbox_tf").on("change",function(){
    var cbox_state = $("#cbox_tf").is(":checked");
    if (cbox_state) {
        $("#resultpanel").css("display", "block");
        $("#li_tf").css("display", "block");
        $("#taifeng_info").css("display", "block");
        //移除之前的高亮样式
        $(".tab-li").removeClass("active");
        $(".tab-pane").removeClass("active");
        //将当前所选表格置于高亮
        $("#li_tf").addClass("active");
        $("#taifeng").addClass("active");
        //显示台风标注
        map.getView().setCenter([12308196.042592192, 2719935.2144997073]);
        map.getView().setZoom(5);
        addTfljLine();
        if ($("#legend_control_hide").css("display") != "block") {
            //显示图例
            $("#legend_control_show").css("display", "block");
        }
    }
    else {
        var haschecked = false;
        $(".cbox").each(function () {
            if (this.checked == true) {
                haschecked = true;
            }
        });
        if (!haschecked) {
            $("#resultpanel").css("display", "none");
            //关闭图例
            $("#legend_control_show").css("display", "none");
            $("#legend_control_hide").css("display", "none");
        }
        else {
            //移除之前的高亮样式
            $(".tab-li").removeClass("active");
            $(".tab-pane").removeClass("active");
            if ($("#cbox_sq").is(":checked")) {
                //水情高亮
                $("#li_sq").addClass("active");
                $("#shuiqing").addClass("active");
            }
            else {
                //雨情高亮
                $("#li_yq").addClass("active");
                $("#yuqing").addClass("active");
            }
        }
        $("#li_tf").css("display", "none");
        $("#taifeng_info").css("display", "none");
        $("#taifeng_lujing").css("display", "none");
        $(".tflj_label").css("display", "none");
        //去除行高亮背景
        $(".success").removeClass('success');
        //取消table的选中
        $("#tb_taifeng").bootstrapTable('uncheck', 0);
        map.getView().setCenter([12308196.042592192, 2719935.2144997073]);
        map.getView().setZoom(6);
        //清除台风标线
        if (tfljDrawLayer != null) {
            tfljDrawLayer.getSource().clear();
        }
        PopopOverlay.setPosition(undefined);
        //清除台风路径
        clearTfljMarker();
        clearTfljPath();
        clearTimer();
        clearTFCurrentCircle();
        //关闭台风图例
        $("#legend_control").css("display", "none");
    }
    PopopOverlay.setPosition(undefined);
})

/***********************************卫星云图start*******************************/
/*
*	打开新的页面，在新的页面展示卫星云图的信息，此页面无需传入任何参数
*@author zjh 2019-01-04
*/
$("#cbox_wxyt").on("change",function(){
    if ($("#cbox_wxyt").prop("checked")) {
        $("#dialog").dialog("open"); //打开卫星云图功能窗口
    }
    else {
        $("#dialog").dialog("close"); //关闭卫星云图功能窗口
    }
})

/***********************************卫星云图end*******************************/   
//显示水库表格
$("#radio_sk").on("click",function(){
    $("#sqsk").css("display", "block");
    $("#sqhl").css("display", "none");
    clearSssqMarker("river");       //清除添加的标注
    clearSssqMarker("Rver");       //清除添加的标注
    PopopOverlay.setPosition(undefined);
    addWaterMarker(sqsk_InfoArray, "marker_sk");
})
//显示河流表格
$("#radio_hl").on("click",function(){
    $("#sqsk").css("display", "none");
    $("#sqhl").css("display", "block");
    clearSssqMarker("river");       //清除添加的标注
    clearSssqMarker("Rver");       //清除添加的标注
    PopopOverlay.setPosition(undefined);
    addWaterMarker(sqhl_InfoArray, "marker_hl");
})
//显示雨量信息表格
$("#radio_ylxx").on("click",function(){
    $("#div_infoYlxx").css("display", "block");
    $("#div_infoGszdyl").css("display", "none");
    $("#div_infoLjtj").css("display", "none");
})
//显示-各市最大雨量表格
$("#radio_gszdyl").on("click",function(){
    $("#div_infoYlxx").css("display", "none");
    $("#div_infoGszdyl").css("display", "block");
    $("#div_infoLjtj").css("display", "none");
})
//显示-量级统计表格
$("#radio_ljtj").on("click",function(){
    $("#div_infoYlxx").css("display", "none");
    $("#div_infoGszdyl").css("display", "none");
    $("#div_infoLjtj").css("display", "block");
})

//隐藏图例面板
$("#legToggle").on("click",function(){
    $("#legend_control_hide").css("display", "block");
    $("#legend_control_show").css("display", "none");
})
//显示图例面板
$("#legendShow").on("click",function(){
    $("#legend_control_hide").css("display", "none");
    $("#legend_control_show").css("display", "block");
})

//关闭表格界面
$("#tableclose").on("click",function(){
    $(".cbox").prop("checked", false);

    $("#resultpanel").css("display", "none");
    //关闭图例
    $("#legend_control_show").css("display", "none");
    $("#legend_control_hide").css("display", "none");
    //去除行高亮背景
    $(".success").removeClass('success');
    //移除之前的高亮样式
    $(".tab-li").removeClass("active");
    $(".tab-pane").removeClass("active");
    //清除popup
    PopopOverlay.setPosition(undefined);
    //移除水情部分
    $("#li_sq").css("display", "none");
    $("#sqsk").css("display", "none");
    $("#sqhl").css("display", "none");
    clearSssqMarker("river");       //清除添加的标注
    clearSssqMarker("Rver");       //清除添加的标注
    $("#tb_shuiku").bootstrapTable("resetSearch");
    $("#tb_heliu").bootstrapTable("resetSearch");
    //移除雨情部分
    $("#li_yq").css("display", "none");
    $("#div_infoYlxx").css("display", "none");
    $("#div_infoGszdyl").css("display", "none");
    $("#div_infoLjtj").css("display", "none");
    clearSsyqMarker(); //移除标注
    //移除台风部分
    $("#li_tf").css("display", "none");
    $("#taifeng_info").css("display", "none");
    $("#taifeng_lujing").css("display", "none");
    $(".tflj_label").css("display", "none");
    //取消table的选中
    $("#tb_taifeng").bootstrapTable('uncheck', 0);
    map.getView().setCenter([12308196.042592192, 2719935.2144997073]);
    map.getView().setZoom(6);
    //清除台风标线
    if (tfljDrawLayer != null) {
        tfljDrawLayer.getSource().clear();
    }   
    //清除台风路径
    clearTfljMarker();
    clearTfljPath();
    clearTimer();
    clearTFCurrentCircle();
})

//MainFun.js内容
//=======================================
var info = new Array();
var ssyq_info = new Array();
var popupCxt;
var container;
var Ylxx_data = new Array();
/***********************************实时水情start*******************************/
var sssqMarkerLayer = null;         //实时水情标注图层
var sssqRiverMarkerArray = null;    //实时水情河流标注数组，用来联系地图上添加的标注与实时水情表格数据
var sssqRverMarkerArray = null;     //实时水情水库标注数组，用来联系地图上添加的标注与实时水情表格数据
var IsRiver = true;                 //是否查询实时水情--河流
var IsRver = false;                 //是否查询实时水情--水库
var sssqMarkerDetailData = null;    //记录每个标注的详细信息

/***********************************实时雨情start*******************************/
var ssyqResInfoArray = new Array();     //记录实时雨情数组
var ssyqMarkerLayer = null;             //实时雨情标注图层
var ssyqMarkerArray = null;             //实时雨情标注数组
var ssyqPopup = null;                   //实时雨情标注详细框
var ssyqMarkerDetailData = null;        //实时雨情详细信息

/***********************************台风路径start*******************************/
var tfljDrawLayer = null;                   //显示台风预警线图层
var tfljPathInfoLayer = null;               //显示台风路径绘制图层
var tfljPntInfoLayer = null;                //显示台风路径点信息图层，即添加标注的图层
var tfMarkerArray = new Array();            //台风标注数组
var tfPathInfoArray = new Array();          //台风路径信息数组
var tfljPopup = null;                       //台风路径标注详细信息弹出框
var tfID = null;                            //台风ID
var tfInfoTimer = null;                     //台风路径信息绘制时间控制器
var tfDetailInfoArray = new Array();        //台风详细信息数组
var tfForcastInfoArray = new Array();       //台风预测信息数组
var tfCurrentMarker = null;                 //显示当前台风位置
var tfCurrentCircle1 = null;                //显示当前台风位置的圆圈1
var tfCurrentCircle2 = null;                //显示当前台风位置的圆圈2
var tfVectorLayer = null;                   //绘制台风的矢量图层

/*
*	根据后台返回的实时水情数据添加标注
*/
function addWaterMarker(resInfoArray,type) {
    if (sssqMarkerLayer == null) {
        //实时水情标注的矢量图层
        sssqMarkerLayer = new VectorLayer ({
            source: new VectorSource()
        });
        map.addLayer(sssqMarkerLayer);
    }

    var markerFeature; //标注（矢量要素）

    if (type == "marker_sk") {
        for (var i = 0; i < resInfoArray.length; i++) {
            var lon = resInfoArray[i].SitePntX;
            var lat = resInfoArray[i].SitePntY;
            var coordinate = [parseFloat(lon), parseFloat(lat)]; //坐标点（ol.coordinate）
            var imgURL = "sssq-green.8bf4239c.png";
            var _WaterPos = parseFloat(resInfoArray[i].WaterPos);
            var _WarnNum = parseFloat(resInfoArray[i].WarnNum);
            if (_WaterPos > _WarnNum) {
                imgURL = "sssq-red.52dbbf91.png";
            }
            //新建标注（Vector要素），通过矢量图层添加到地图容器中
            markerFeature = new Feature({
                geometry: new Point(coordinate), //几何信息（坐标点）
                name: resInfoArray[i].SiteName,  //名称属性
                type: "Rver",  //类型（河流）
                info: resInfoArray[i],  //标注的详细信息
                imgURL: imgURL,  //标注图标的URL地址
                fid: "Rver" + i.toString()
            });
            markerFeature.setStyle(createLabelStyle(imgURL, 0.8));
            sssqMarkerLayer.getSource().addFeature(markerFeature);

            if (sssqRverMarkerArray == null) {
                sssqRverMarkerArray = new Array();
            }
            sssqRverMarkerArray.push(markerFeature);
        }
    }

    //实时水情--河流信息可显示
    if (type == "marker_hl") {
        for (var i = 0; i < resInfoArray.length; i++) {
            var lon = resInfoArray[i].SitePntX; //X值
            var lat = resInfoArray[i].SitePntY; //Y值
            var coordinate = [parseFloat(lon), parseFloat(lat)]; //坐标点（ol.coordinate）
            var imgURL = "sssq-green.8bf4239c.png"; //正常类型标注图标
            if (resInfoArray[i].WaterPos < resInfoArray[i].WarnNum) {
                imgURL = "sssq-red.52dbbf91.png"; //超标类型标注图标
            }
            //新建标注（Vector要素），通过矢量图层添加到地图容器中
            markerFeature = new Feature({
                geometry: new Point(coordinate), //几何信息（坐标点）
                name: resInfoArray[i].SiteName,  //名称属性
                type: "river",  //类型（河流）
                info: resInfoArray[i],  //标注的详细信息
                imgURL: imgURL,  //标注图标的URL地址
                fid: "river" + i.toString()
            });
            markerFeature.setStyle(createLabelStyle(imgURL, 0.8));
            sssqMarkerLayer.getSource().addFeature(markerFeature);

            if (sssqRiverMarkerArray == null) {
                sssqRiverMarkerArray = new Array();
            }
            sssqRiverMarkerArray.push(markerFeature);
        }
    }   
}


/*
*	添加实时雨情标注，每一个雨量值对应不同的标注，并且在勾选的时候将所有的标注清空重新进行添加
*/
function addRainMarker() {
    if (ssyqMarkerLayer == null) {
        //实时雨情标注的矢量图层
        ssyqMarkerLayer = new VectorLayer({
            source: new VectorSource()
        });
        map.addLayer(ssyqMarkerLayer);
    }

    var ssyqMarkerFeature;
    for (var i = 0; i < Ylxx_data.length; i++) {
        var ssyqResInfo = Ylxx_data[i];
        var lon = ssyqResInfo.SitePntX;
        var lat = ssyqResInfo.SitePntY;
        var coordinate = [parseFloat(lon), parseFloat(lat)]; //坐标点（ol.coordinate）
        var imgURL = "";
        if (ssyqResInfo.RainNum > 0 && ssyqResInfo.RainNum < 10) {
            imgURL = "yq01.26345b6d.png";
        } if (ssyqResInfo.RainNum >= 10 && ssyqResInfo.RainNum < 25) {
            imgURL = "yq02.c4eccaec.png";
        } else if (ssyqResInfo.RainNum >= 25 && ssyqResInfo.RainNum < 50) {
            imgURL = "yq03.937a892e.png";
        } else if (ssyqResInfo.RainNum >= 50 && ssyqResInfo.RainNum < 100) {
            imgURL = "yq04.01db3265.png";
        } else if (ssyqResInfo.RainNum >= 100 && ssyqResInfo.RainNum < 250) {
            imgURL = "yq05.0480b442.png";
        } else if (ssyqResInfo.RainNum >= 250) {
            imgURL = "yq06.eb44a73c.png";
        }

        //新建标注（Vector要素），通过矢量图层添加到地图容器中
        ssyqMarkerFeature = new Feature({
            geometry: new Point(coordinate), //几何信息（坐标点）
            name: Ylxx_data[i].SiteName,  //名称属性
            type: "sq",  //类型（河流）
            info: ssyqResInfo,  //标注的详细信息
            imgURL: imgURL,  //标注图标的URL地址
            fid: "sq" + i.toString()
        });
        ssyqMarkerFeature.setStyle(createLabelStyle(imgURL, 0.8));
        ssyqMarkerLayer.getSource().addFeature(ssyqMarkerFeature);

        if (ssyqMarkerArray == null) {
            ssyqMarkerArray = new Array();
        }
        ssyqMarkerArray.push(ssyqMarkerFeature);
    }
}

/*
*	显示实时水情popup
*@author zjh 2018-08-13
*/
function showSssqPopup(data, type) {

    var type = type;
    var fInfo = data;
    var urlStr = encodeURI("Handler.ashx?method=sssq&oper=WaterHisInfo&type=" + type + "&siteNum=" + fInfo.SiteNum);
    $.ajax({
        type: "get",
        contentType: "application/json",
        url: urlStr,
        async: false,
        success: showSiteDetailInfo
    });
    
    //获取时间
    var time = formatDate(info[0].TM);
    var labeltext, labelclass;
    //先判断是否为空，防止为null时parsefloat报错
    if (data.WarnNum == null || parseFloat(data.WaterPos) <= parseFloat(data.WarnNum)) {
        //安全水位
        labeltext = "安全水位";
        labelclass = "label-success";
    }
    else {
        //危险水位
        labeltext = "超戒水位";
        labelclass = "label-danger";
    }

    //popup中的内容设置
    var html = '<div id="chartzjh" style="width:300px;height:220px;"></div></br>'
             + '<div style="width:300px;height:80px;font-size: 13px;line-height:7px;position:relative;margin-top:-15px"><ul class="list-group" style="width:290px">'
             + '<li class="list-group-item">最新水位：' + '<span class="label label-info">' + info[info.length - 1].WaterPos + '</span>' + '<span class="label '+labelclass+'" style="margin-left:15px">'+labeltext+'</span>'
             + '</li><li class="list-group-item">时&emsp;&emsp;间：' + time
             + '</li><li class="list-group-item">站&emsp;&emsp;址：' + info[info.length - 1].SiteAddress + '</li></ul></div>';
    //获取要素点坐标
    var coordinate = [parseFloat(data.SitePntX), parseFloat(data.SitePntY)]; 
    //获取popup-content标签
    popupCxt = $("#popup-content");
    //设置Popup容器里的内容
    popupCxt.html(html); 

    var names = new Array();
    var values = new Array();
    for (var i = 0; i < info.length; i++) {
        names[i] = info[i].tm.split(":")[0] + "时";
        values[i] = info[i].WaterPos;
    }

    // 初始化图表标签
    myChart = echarts.init(document.getElementById('chartzjh'),"light");
    var subtext;
    type=="Rver"?subtext="水库":subtext="河流";
    var text=info[0].SiteName+"-水位图";
    //正则，去除字符串中间的空格
    text=text.replace(/\s/g,'');
    var options = {
        //定义一个标题
        title: {
            text: text,
            //            subtext: '水位值',
            textStyle:{fontSize: 16}      
            
        },
        //设置图表与容器的间隔
        grid:{
            x:33,
            x2:50,
            y:70,
            y2:25
               
        },
        toolbox: {
            show : true,
            orient: 'horizontal',
            x:'175',

            feature : {
                mark : {show: true},
                dataView : {show: true, readOnly: false},
                magicType : {show: true, type: ['line', 'bar']},
                saveAsImage : {show: true}
            }
        },
        tooltip : {
            trigger: 'axis'
        },

        //X轴设置
        xAxis: {
            type: 'category',
            data: names,
            name:"时间"
        },
        yAxis: {
            name:"水位",
            type: 'value'
        },
        //name=legend.data的时候才能显示图例
        series: [{
            name: '水位值',
            type: 'bar',
            data: values,
            barWidth : 30,//柱图宽度
            markPoint : {
                data : [
                    {type : 'max', name: '最大值'},
                    {type : 'min', name: '最小值'}
                ]
            },
            markLine : {
                data : [
                    {type : 'average', name: '平均值'}
                ]
            }
            
        }]
    };
    myChart.setOption(options);
    //设置popup坐标，如果popup超出位置，会自动改变地图显示中心以适应（ol实现的）
    PopopOverlay.setPosition(coordinate);
}


/*
*	显示实时雨情popup
*@author zjh 2018-08-13
*/
function showSsyqPopup(data) {
    
    var fInfo = data;
    var urlStr = encodeURI("Handler.ashx?method=ssyq&oper=rainInfo&s=" + s + "&e=" + e + "&siteNum=" + fInfo.SiteNum);
    $.ajax({
        type: "get",
        contentType: "application/json",
        url: urlStr,
        async: false,
        success: showssyqRainDetailInfo
    });

    //获取时间
    var time = formatDate(ssyq_info[0].TM);
    //popup中的内容设置
    var html = '<div id="chartzjh" style="width:300px;height:220px;"></div></br>'
             + '<div style="width:300px;height:80px;font-size:13px;line-height:7px;position:relative;margin-top:-15px"><ul class="list-group" style="width:320px">'
             + '<li class="list-group-item ">最新雨量：'+'<span class="label label-info">' + ssyq_info[ssyq_info.length - 1].RainNum + '</span>'
             + '</li><li class="list-group-item">时&emsp;&emsp;间：' + time
             + '</li><li class="list-group-item">站&emsp;&emsp;址：' + ssyq_info[0].SiteAddress + '</li></ul></div>';
    //获取要素点坐标
    var coordinate = [parseFloat(data.SitePntX), parseFloat(data.SitePntY)]; 
    //获取popup-content标签
    popupCxt = $("#popup-content");
    //设置Popup容器里的内容
    popupCxt.html(html);

    var names = new Array();
    var values = new Array();
    for (var i = 0; i < ssyq_info.length; i++) {
        names[i] = ssyq_info[i].tm.split(":")[0] + "时";
        values[i] = ssyq_info[i].RainNum;
    }

    // 初始化图表标签
    myChart = echarts.init(document.getElementById('chartzjh'),"light");
    var text=ssyq_info[0].SiteName+"-雨量图";
    //正则，去除字符串中间的空格
    text=text.replace(/\s/g,'');
    var options = {
        //定义一个标题
        title: {
            text: text,
            textStyle:{fontSize: 16}   
            
        },
        //设置图表与容器的间隔
        //设置图表与容器的间隔
        grid:{
            x2:50,
            y:70,
            y2:25 
        },
        toolbox: {
            show : true,
            orient: 'horizontal',
            x:'175',

            feature : {
                mark : {show: true},
                dataView : {show: true, readOnly: false},
                magicType : {show: true, type: ['line', 'bar']},
                saveAsImage : {show: true}
            }
        },
        tooltip : {
            trigger: 'axis'
        },
       
        //X轴设置
        xAxis: {
            type: 'category',
            data: names,
            name:"时间"
        },
        yAxis: {
            name:"雨量",
            type: 'value'
        },
        //name=legend.data的时候才能显示图例
        series: [{
            name: '雨量值',
            type: 'bar',
            data: values,
            barWidth : 30,//柱图宽度
            markPoint : {
                data : [
                    {type : 'max', name: '最大值'},
                    {type : 'min', name: '最小值'}
                ]
            },
            markLine : {
                data : [
                    {type : 'average', name: '平均值'}
                ]
            }
            
        }]
    };

    myChart.setOption(options);
    //设置popup的位置
    PopopOverlay.setPosition(coordinate);
}


/*
*	查询标注对应的站点的详细信息
*@author fmm 2015-06-16
*/
function showSiteDetailInfo(data) {
    var resInfo = eval('(' + data + ')');
    if (resInfo == null) {
        return;
    }
    info = resInfo;  //将站点详细信息写到全局变量数组
}

/*
*	清除实时水情标注,
*@author fmm 2015-06-11
*/
function clearSssqMarker(type) {
    if (sssqMarkerLayer != null) {
        if (type == "river" && sssqRiverMarkerArray != null) {       //清除实时水情--河流信息
            for (var i = 0; i < sssqRiverMarkerArray.length; i++) {
                sssqMarkerLayer.getSource().removeFeature(sssqRiverMarkerArray[i]); //移除河流标注要素
            }
            sssqRiverMarkerArray = null;
        }
        if (type == "Rver" && sssqRverMarkerArray != null) {      //清除实时水情--水库信息
            for (var i = 0; i < sssqRverMarkerArray.length; i++) {
                sssqMarkerLayer.getSource().removeFeature(sssqRverMarkerArray[i]); //移除水库标注要素
            }
            sssqRverMarkerArray = null;
        }
    }
}

/*
*	时间格式化
*/
Date.prototype.format = function (format) {
    var o = {
        "M+": this.getMonth() + 1, //month
        "d+": this.getDate(), //day
        "h+": this.getHours(), //hour
        "m+": this.getMinutes(), //minute
        "s+": this.getSeconds(), //second
        "q+": Math.floor((this.getMonth() + 3) / 3), //quarter
        "S": this.getMilliseconds() //millisecond
    }
    if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
        (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o) if (new RegExp("(" + k + ")").test(format))
        format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
    return format;
}

/*
*	时间格式化
*/
function formatDate(val) {
    var re = /-?\d+/;
    var m = re.exec(val);
    var d = new Date(parseInt(m[0]));
    // 按【2012-02-13 09:09:09】的格式返回日期
    return d.format("yyyy-MM-dd");
}

/*
*	显示实时雨情详细框，记录请求到的数据
*@author fmm 2015-07-09
*/
function showssyqRainDetailInfo(data) {
    var resInfo = eval('(' + data + ')');
    if (resInfo == null) {
        return;
    }
    ssyq_info = resInfo;
}


/*
*	点击雨量勾选框进行查询操作
*/
$(".ylxxCheckbox").on("change",function(){
    //清除实时雨情标注
    clearSsyqMarker();          
    //查询之前，必须将之前的结果数组置空
    if (Ylxx_data != null || Ylxx_data.length > 0) {
        Ylxx_data = null;
        Ylxx_data = new Array();
    }
    //遍历所有的复选框，对勾选的进行查询请求
    $(".ylxxCheckbox").each(function () {
        if (this.checked == true) {
            var type = parseInt(this.value);
            switch (type) {
                case 10:
                    minRain = 0;
                    maxRain = 9.99;
                    callRainInfo(minRain, maxRain);
                    break;
                case 25:
                    minRain = 10
                    maxRain = 24.99;
                    callRainInfo(minRain, maxRain);
                    break;
                case 50:
                    minRain = 25;
                    maxRain = 49.99;
                    callRainInfo(minRain, maxRain);
                    break;
                case 100:
                    minRain = 50;
                    maxRain = 99.99;
                    callRainInfo(minRain, maxRain);
                    break;
                case 250:
                    minRain = 100;
                    maxRain = 249.99;
                    callRainInfo(minRain, maxRain);
                    break;
                case 260:
                    minRain = 250;
                    maxRain = 10000;
                    callRainInfo(minRain, maxRain);
                    break;
                default:
                    break;
            }
        }
    });

    //销毁之前的雨量信息表格，用新数据创建新表格
    $("#tb_infoYlxx").bootstrapTable('destroy');
    var tb_ylxx2 = new Table_yqYlxx2(Ylxx_data);
    tb_ylxx2.Init();
    //销毁之前的各市最大雨量表格，用新数据创建新表格
    $("#tb_infoGszdyl").bootstrapTable('destroy');
    var tb_gszdyl2 = new Table_yqGszdyl2(Ylxx_data);
    tb_gszdyl2.Init();

    //销毁之前的量级统计表格，用新数据创建新表格
    $("#tb_infoLjtj").bootstrapTable('destroy');
    var num1 = 0, num2 = 0, num3 = 0, num4 = 0, num5 = 0, num6 = 0;
    for (var i = 0; i < Ylxx_data.length; i++) {
        var rainNum = Ylxx_data[i].RainNum;
        if (rainNum > 0 && rainNum < 10) {
            num1++;
        } else if (rainNum >= 10 && rainNum < 25) {
            num2++;
        } else if (rainNum >= 25 && rainNum < 50) {
            num3++;
        } else if (rainNum >= 50 && rainNum < 100) {
            num4++;
        } else if (rainNum >= 100 && rainNum < 250) {
            num5++;
        } else if (rainNum >= 250) {
            num6++;
        }
    }
    var lj_data_extend = ["小于10", "[10,25)", "[25,50)", "[50,100)", "[100,250)", "250以上"];
    var lj_data_num = [num1, num2, num3, num4, num5, num6];
    var lj_data = [];
    for (var j = 0; j < 6; j++) {
        lj_data[j] = { "Extend": lj_data_extend[j],
            "SiteNum": lj_data_num[j]
        };
    }
    var tb_ljtj2 = new Table_yqLjtj2(lj_data);
    tb_ljtj2.Init();

    //添加雨情标注点
    addRainMarker();
})

/*
*	实时查询雨量信息
*@author fmm 2015-07-07
*/
function callRainInfo(minRain, maxRain) {

    var urlStr = encodeURI("Handler.ashx?method=ssyq&oper=rainNum&s=" + s + "&e=" + e + "&minRain=" + minRain + "&maxRain=" + maxRain);
    $.ajax({
        type: "get",
        contentType: "application/json",
        url: urlStr,
        async: false,
        success: showRainInfo
    });
}


/*
*	得到实时雨情信息回调方法
*/
function showRainInfo(data) {
    if (ssyqResInfoArray != null) {
        ssyqResInfoArray = new Array();
    }
    ssyqResInfoArray = eval('(' + data + ')');
    if (Ylxx_data == null || Ylxx_data == undefined || Ylxx_data.length <= 0) {
        Ylxx_data = ssyqResInfoArray;
    }
    else {
        Ylxx_data = Ylxx_data.concat(ssyqResInfoArray);  
    }
}


//雨情_雨量信息
var Table_yqYlxx2 = function (data) {

    var oTableInit = new Object();
    //初始化Table
    oTableInit.Init = function () {
        $('#tb_infoYlxx').bootstrapTable({
            method: 'get',                      //请求方式（*）
            // url: encodeURI("Handler.ashx?method=ssyq&oper=rainNum&s=" + s + "&e=" + e + "&minRain=" + minRain + "&maxRain=" + maxRain + "&" + Math.random()), //请求后台的URL（*） -->
            dataType: 'json',

            cache: false,
            striped: true,                       //是否显示行间隔色
            sidePagination: "client",           //分页方式：client客户端分页，server服务端分页（*）
            showColumns: true,
            sortable: true,                     //是否启用排序
            sortClass: "id",                   //排序方式
            sortName: '序号',
            sortOrder: "desc",                   //排序方式
            minimumCountColumns: 2,
            pagination: true,
            pageNumber: 1,                       //初始化加载第一页，默认第一页
            pageSize: 5,                       //每页的记录行数（*）
            pageList: [5],        //可供选择的每页的行数（*）
            search: false,                    //是否显示查询面板
            uniqueId: "id",                     //每一行的唯一标识，一般为主键列
            showExport: true,
            exportDataType: 'all',

            showColumns: false,                  //是否显示所有的列
            showRefresh: false,                  //是否显示刷新按钮
            minimumCountColumns: 2,             //最少允许的列数
            clickToSelect: true,                //是否启用点击选中行
            //行高，如果没有设置height属性，表格自动根据记录条数觉得表格高度
            uniqueId: "ID",                     //每一行的唯一标识，一般为主键列
            showToggle: false,                    //是否显示详细视图和列表视图的切换按钮
            cardView: false,                    //是否显示详细视图
            detailView: false,                   //是否显示父子表

            data: data,

            columns: [{
                checkbox: false,
                visible: false
            }, {
                field: 'no',
                title: '序号',
                //                class: 'w70',
                sortable: true,
                formatter: function (value, row, index) {
                    //获取每页显示的数量
                    var pageSize = $('#tb_infoYlxx').bootstrapTable('getOptions').pageSize;
                    //获取当前是第几页
                    var pageNumber = $('#tb_infoYlxx').bootstrapTable('getOptions').pageNumber;
                    //返回序号，注意index是从0开始的，所以要加上1
                    return index + 1;
                }
            }, {
                field: 'SiteName',
                title: '站名',
                class: 'w70'

            }, {
                field: 'SiteNum',
                title: '站码',
                class: 'w80'
            },

                   {
                       field: 'RainNum',
                       title: '雨量',
                       class: 'w60'
                   },
                    {
                        field: 'SiteAddress',
                        title: '站址',
                        class: 'w220'
                    }

            ],

            onClickRow: function (row, element) {
                $(".success").removeClass('success');
                $(element).addClass('success'); //添加当前选中的 success样式用于区别
                var coordinate = [parseFloat(row.SitePntX), parseFloat(row.SitePntY)]; //获取要素点坐标

                map.getView().setCenter(coordinate); //设置地图中心点
                map.once("moveend", function () {
                    showSsyqPopup(row);
                });
            }
        });
    };
    return oTableInit;
};


//雨情_各市最大雨量
var Table_yqGszdyl2 = function (data) {

    var oTableInit = new Object();
    //初始化Table
    oTableInit.Init = function () {
        $('#tb_infoGszdyl').bootstrapTable({
            method: 'get',                      //请求方式（*）
            //url: encodeURI("Handler.ashx?method=ssyq&oper=rainNum&s=" + s + "&e=" + e + "&minRain=" + minRain + "&maxRain=" + maxRain + "&" + Math.random()), //请求后台的URL（*） -->
            dataType: 'json',

            cache: false,
            striped: true,                       //是否显示行间隔色
            sidePagination: "client",           //分页方式：client客户端分页，server服务端分页（*）
            showColumns: true,
            sortable: true,                     //是否启用排序
            sortClass: "id",                   //排序方式
            sortName: '序号',
            sortOrder: "desc",                   //排序方式
            minimumCountColumns: 2,
            pagination: true,
            pageNumber: 1,                       //初始化加载第一页，默认第一页
            pageSize: 5,                       //每页的记录行数（*）
            pageList: [5],        //可供选择的每页的行数（*）
            search: false,                    //是否显示查询面板
            uniqueId: "id",                     //每一行的唯一标识，一般为主键列
            showExport: true,
            exportDataType: 'all',

            showColumns: false,                  //是否显示所有的列
            showRefresh: false,                  //是否显示刷新按钮
            minimumCountColumns: 2,             //最少允许的列数
            clickToSelect: true,                //是否启用点击选中行
            //行高，如果没有设置height属性，表格自动根据记录条数觉得表格高度
            uniqueId: "ID",                     //每一行的唯一标识，一般为主键列
            showToggle: false,                    //是否显示详细视图和列表视图的切换按钮
            cardView: false,                    //是否显示详细视图
            detailView: false,                   //是否显示父子表
            responseHandler: oTableInit.responseHandler, //ajax已请求到数据，表格加载数据之前调用函数
            data: data,
            columns: [{
                checkbox: false,
                visible: false
            }, {
                field: 'no',
                title: '序号',
                sortable: true,
                formatter: function (value, row, index) {
                    //获取每页显示的数量
                    var pageSize = $('#tb_infoYlxx').bootstrapTable('getOptions').pageSize;
                    //获取当前是第几页
                    var pageNumber = $('#tb_infoYlxx').bootstrapTable('getOptions').pageNumber;
                    //返回序号，注意index是从0开始的，所以要加上1
                    return index + 1;
                }
            },{
                field: 'Pro',
                title: '城市',
                class: 'w60'

            }, {
                field: 'SiteName',
                title: '地区',
                class: 'w60'
            },

                   {
                       field: 'RainNum',
                       title: '最大雨量',
                       class: 'w70'
                   }

            ]

        });

    };

    //加载服务器数据之前的处理程序
    oTableInit.responseHandler = function (res) {
        var temp = {
            "rows": [],
            "total": 0
        };
        if (!!res) {
            if (res.code == '1') {
                temp.rows = JSON.parse(res.list);
                temp.total = parseInt(res.total);
            }
        }
        return res;
    };


    return oTableInit;
};

//雨情_量级统计
var Table_yqLjtj2 = function (data) {
    var oTableInit = new Object();
    //初始化Table
    oTableInit.Init = function () {
        $('#tb_infoLjtj').bootstrapTable({
            method: 'get',                      //请求方式（*）

            dataType: 'json',
            cache: false,
            striped: true,                       //是否显示行间隔色
            sidePagination: "client",           //分页方式：client客户端分页，server服务端分页（*）
            showColumns: true,
            sortable: true,                     //是否启用排序
            sortClass: "id",                   //排序方式
            sortName: '序号',
            sortOrder: "desc",                   //排序方式
            minimumCountColumns: 2,
            pagination: true,
            pageNumber: 1,                       //初始化加载第一页，默认第一页
            pageSize: 6,                       //每页的记录行数（*）
            pageList: [6],        //可供选择的每页的行数（*）
            search: false,                    //是否显示查询面板
            uniqueId: "id",                     //每一行的唯一标识，一般为主键列
            showExport: true,
            exportDataType: 'all',

            showColumns: false,                  //是否显示所有的列
            showRefresh: false,                  //是否显示刷新按钮
            minimumCountColumns: 2,             //最少允许的列数
            clickToSelect: true,                //是否启用点击选中行
            //行高，如果没有设置height属性，表格自动根据记录条数觉得表格高度
            uniqueId: "ID",                     //每一行的唯一标识，一般为主键列
            showToggle: false,                    //是否显示详细视图和列表视图的切换按钮
            cardView: false,                    //是否显示详细视图
            detailView: false,                   //是否显示父子表
            //queryParams: oTableInit.queryParams, //传递参数（*）
            queryParamsType: '',
            responseHandler: oTableInit.responseHandler, //ajax已请求到数据，表格加载数据之前调用函数
            data:data,

            columns: [{
                checkbox: false,
                visible: false
            }, {
                field: 'Extend',
                title: '雨量范围（mm）',
                class: 'w120'

            }, {
                field: 'SiteNum',
                title: '区县数',
                class: 'w80'
            }
            ]

        });

    };

    //加载服务器数据之前的处理程序
    oTableInit.responseHandler = function (res) {
        var temp = {
            "rows": [],
            "total": 0
        };
        if (!!res) {
            if (res.code == '1') {
                temp.rows = JSON.parse(res.list);
                temp.total = parseInt(res.total);
            }
        }
        return res;
    };


    return oTableInit;
};



/*
*	将实时雨情标注点清空
*@author fmm 2015-07-08
*/
function clearSsyqMarker() {
    if (ssyqMarkerLayer != null) {
        for (var i = 0; ssyqMarkerArray != null && i < ssyqMarkerArray.length; i++) {
            ssyqMarkerLayer.getSource().removeFeature(ssyqMarkerArray[i]); //移除雨情标注要素
        }
        ssyqMarkerArray = null;
    }
}


/*
*	查询到的预测信息
*@author fmm 2015-06-17
*/
function tfljForcastOnsuccess(data) {
    var resInfoArray = eval('(' + data + ')');
    tfForcastInfoArray = resInfoArray;
}

/*
*	清除台风路径标注
*@author fmm 2015-06-18
*/
function clearTfljMarker() {
    if (tfljPntInfoLayer != null && tfMarkerArray != undefined) {             //清除标注
        for (var i = 0; i < tfMarkerArray.length; i++) {
            tfljPntInfoLayer.getSource().removeFeature(tfMarkerArray[i]);
        }
        tfljPntInfoLayer.getSource().removeFeature(tfCurrentMarker);
        tfMarkerArray = null;
        tfCurrentMarker = null;
    }
}


/*
*	显示台风的popup
*@author zjh 2018-08-15
*/
function showTfljPopup(data) {

    var tfInfo = data;
    if (tfInfo.forecast == undefined) {
        var html = '<div class="tfDetail"><span class="label label-primary" style="font-size:100%">实测路径</span>'
        + '<ul class="list-group tful" style="margin-bottom:0px;margin-top:15px">'
        + '<li class="list-group-item ">过去时间：' + tfInfo.tm
        + '</li><li class="list-group-item ">经度坐标：' + tfInfo.jindu
        + '</li><li class="list-group-item ">纬度坐标：' + tfInfo.weidu
        + '</li><li class="list-group-item ">最大风力：' + tfInfo.windstrong
        + '</li><li class="list-group-item ">最大风速：' + tfInfo.windspeed + '米/秒'
        + '</li><li class="list-group-item ">中心气压：' + tfInfo.qiya + '百帕'
        + '</li><li class="list-group-item ">移动速度：' + tfInfo.movespeed + '公里/小时'
        + '</li><li class="list-group-item ">移动方向：' + tfInfo.movedirect
        + '</li></ul></div>';
    }
    else {
        var html = '<div class="tfDetail"><span class="label label-primary" style="font-size:100%">预测路径</span>'
         + '<ul class="list-group tful" style="margin-bottom:0px;margin-top:15px">'
         + '<li class="list-group-item ">预报机构：' + tfInfo.forecast
         + '<li class="list-group-item ">到达时间：' + tfInfo.tm
         + '<li class="list-group-item ">经度坐标：' + tfInfo.jindu
         + '<li class="list-group-item ">纬度坐标：' + tfInfo.weidu
         + '</li><li class="list-group-item ">最大风力：' + tfInfo.windstrong
         + '</li><li class="list-group-item ">最大风速：' + tfInfo.windspeed + '米/秒'
         + '</li><li class="list-group-item ">中心气压：' + tfInfo.qiya + '百帕'
         + '</li><li class="list-group-item ">移动速度：' + tfInfo.movespeed + '公里/小时'
         + '</li><li class="list-group-item ">移动方向：' + tfInfo.movedirect
        + '</li></ul></div>';
    }

    var coordinate = [parseFloat(data.jindu), parseFloat(data.weidu)]; //获取要素点坐标
    popupCxt = $("#popup-content");

    popupCxt.html(html); //设置Popup容器里的内容
    //设置popup的位置
    PopopOverlay.setPosition(coordinate);
}

/*
*	显示台风路径
*@author fmm 2015-06-17
*/
function addTfljLine() {
    if (tfljDrawLayer == null) {
        //台风路径标线绘制层
        tfljDrawLayer = new VectorLayer({
            source: new VectorSource()
        });
        map.addLayer(tfljDrawLayer);
    }
    //目前需要添加四条标线
    var dots1 = new Array();
    dots1.push([11757464.4300438, 2154935.91508589]);
    dots1.push([12474016.8603311, 2154935.91508589]);
    dots1.push([12474016.8603311, 3123471.74910458]);
    var lin1 = new LineString(dots1);
    var linFeature1 = new Feature({
        geometry: lin1 //几何信息（坐标点）
    });
    var fStyle1 = new Style({
        stroke: new Stroke({
            color: '#990000',
            width: 0.5
        })
    });
    linFeature1.setStyle(fStyle1);
    tfljDrawLayer.getSource().addFeature(linFeature1); //添加图形1

    var dots2 = new Array();
    dots2.push([12052238.4416644, 1804722.76625729]);
    dots2.push([13358338.895192, 1804722.76625729]);
    dots2.push([13358338.8951928, 3096586.04422852]);
    var lin2 = new LineString(dots2);
    var linFeature2 = new Feature({
        geometry: lin2 //几何信息（坐标点）
    });
    var fStyle2 = new Style({
        stroke: new Stroke({
            color: '#660066',
            width: 0.5
        })
    });
    linFeature2.setStyle(fStyle2);
    tfljDrawLayer.getSource().addFeature(linFeature2); //添加图形2

    var dots3 = new Array();
    dots3.push([12245143.9872601, 1689200.13960789]);
    dots3.push([14137575.3307457, 2511525.23484571]);
    dots3.push([14137575.3307457, 4028802.02613441]);
    var lin3 = new LineString(dots3);
    var linFeature3 = new Feature({
        geometry: lin3 //几何信息（坐标点）
    });
    var fStyle3 = new Style({
        stroke: new Stroke({
            color: '#6666FF',
            width: 0.5
        })
    });
    linFeature3.setStyle(fStyle3);
    tfljDrawLayer.getSource().addFeature(linFeature3); //添加图形3

    var dots4 = new Array();
    dots4.push([12245143.9872601, 1689200.13960789]);
    dots4.push([13914936.3491592, 1689200.13960789]);
    dots4.push([14694172.7847121, 2511525.23484571]);
    dots4.push([14694172.7847121, 4028802.02613441]);
    var lin4 = new LineString(dots4);
    var linFeature4 = new Feature({
        geometry: lin4 //几何信息（坐标点）
    });
    var fStyle4 = new Style({
        stroke: new Stroke({
            color: '#009900',
            width: 0.5
        })
    });
    linFeature4.setStyle(fStyle4);
    tfljDrawLayer.getSource().addFeature(linFeature4); //添加图形4
}


/*
*	添加单个点(即路径点与路径线)
*@author fmm 2015-06-18
*/
function addTFPath(i, simplePntInfo) {
    var typhoonFeature; //台风路径点要素
    var size = map.getSize();  //地图容器的大小
    var bound = map.getView().calculateExtent(size); //当前地图范围
    //根据当前地图范围移动地图
    if (bound[1] > simplePntInfo.jindu || bound[2] > simplePntInfo.weidu || bound[3] < simplePntInfo.jindu || bound[0] < simplePntInfo.weidu) {
        map.getView().setCenter([simplePntInfo.jindu, simplePntInfo.weidu]);
        map.getView().setZoom(7);
    }
    var lon = simplePntInfo.jindu;
    var lat = simplePntInfo.weidu;
    var coord = [lon, lat]; //台风路径点坐标
    //第一步：绘制当前台风图片，并在台风图片的周围画两个圆圈
    //（1）绘制台风周围的圆形
    drawTFCircle([lon, lat + 20000]); //绘制圆
    //（2）绘制当前台风的图片标注
    if (tfCurrentMarker != null) {
        tfljPntInfoLayer.getSource().removeFeature(tfCurrentMarker);
    }
    var currentImg = "taifeng.619c7da2.gif";
    tfCurrentMarker = new Feature({
        geometry: new Point(coord), //几何信息（坐标点）
        type: "tfMarker"  //类型（当前台风标识）
    });
    var currentMarkerStyle = new Style({
        image: new Icon(/** @type {olx.style.IconOptions} */({
            anchorOrigin: 'bottom-left',
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            offsetOrigin: 'bottom-left',
            scale: 1,  //图标缩放比例
            opacity: 1,  //透明度
            src: currentImg  //图标的url
        }))
    });
    tfCurrentMarker.setStyle(currentMarkerStyle);
    tfljPntInfoLayer.getSource().addFeature(tfCurrentMarker);
    //第二步：绘制台风路径
    var n = 0;
    var tfGrade = 5;    //若无台风风力，则默认为热带气压
    if (simplePntInfo.windstrong != null) {
        n = simplePntInfo.windstrong.indexOf("级");
        tfGrade = simplePntInfo.windstrong.slice(0, n);
    }
    var imgURL = "";
    if (tfGrade == 4 || tfGrade == 5 || tfGrade == 6) {
        imgURL = "Wind06.abc2d8bd.png";
    }
    if (tfGrade == 7) {                             //热带气压
        imgURL = "Wind06.abc2d8bd.png";
    } else if (tfGrade == 8 || tfGrade == 9) {      //热带风暴
        imgURL = "Wind05.99c53e33.png";
    } else if (tfGrade == 10 || tfGrade == 11) {    //强热带风暴
        imgURL = "Wind04.64ec73c1.png";
    } else if (tfGrade == 12 || tfGrade == 13) {    //台风
        imgURL = "Wind03.b4f7b7e4.png";
    } else if (tfGrade == 14 || tfGrade == 15) {    //强台风
        imgURL = "Wind02.6a5e9ea6.png";
    } else if (tfGrade == 16) {                     //超强台风
        imgURL = "Wind01.0c638630.png";
    }
    //台风路径点标注要素
    typhoonFeature = new Feature({
        geometry: new Point(coord), //几何信息（坐标点）
        type: "typhoon",  //类型（台风）
        info: simplePntInfo,  //标注的详细信息
        imgURL: imgURL,  //标注图标的URL地址
        fid: "typhoonPoint" + i.toString()
    });
    typhoonFeature.setStyle(createLabelStyle(imgURL, 0.8));
    tfljPntInfoLayer.getSource().addFeature(typhoonFeature);
    //将台风路径点要素添加到对应缓存数组中
    if (tfMarkerArray == null) {
        tfMarkerArray = new Array();
    }
    tfMarkerArray.push(typhoonFeature);

    //将台风点添加到台风路径数组
    var dot = [simplePntInfo.jindu, simplePntInfo.weidu];
    if (tfPathInfoArray == null) {
        tfPathInfoArray = new Array();
    }
    tfPathInfoArray.push(dot);
    //绘制的不是第一个点，则要绘制中间的路径线
    if (i > 0) {
        var linFeature = new Feature({
            geometry: new LineString(tfPathInfoArray)  //线的几何信息（坐标点）
        });
        //设置线要素的样式
        linFeature.setStyle(new Style({
            stroke: new Stroke({
                color: '#EE0000',
                width: 2
            })
        })
        );
        tfljPathInfoLayer.getSource().addFeature(linFeature); //添加线要素
    }
}

/*
*	绘制台风周围的圆形
*@author fmm 2015-07-14
*/
function drawTFCircle(origin) {
    if (tfCurrentCircle1 != null) {
        clearTFCurrentCircle();
    }
    var origin = origin;
    var radius1 = 40000;
    var radius2 = 80000;

    tfCurrentCircle1 = new Feature({
        geometry: new Circle(origin, radius1,'XY'), //第一个圆的几何信息
        type: 'tfCircle'
    });
    tfCurrentCircle2 = new Feature({
        geometry: new Circle(origin, radius2,'XY'), //第二个圆的几何信息
        type: 'tfCircle'
    });
    var circleStyle = new Style({
        fill: new Fill({
            color: 'rgba(255, 102, 0, 0.2)'
        }),
        stroke: new Stroke({
            color: '#ff6600',
            width: 1
        })
    });
    tfVectorLayer.setStyle(circleStyle); //设置图层要素的样式
    tfVectorLayer.getSource().addFeatures([tfCurrentCircle1, tfCurrentCircle2]); //添加要素
}

/*
*	画出台风的预测路径信息，包括标注点以及移动路径，每个国家预测路径用不同的颜色表示
*@author fmm 2015-06-18
*/
function drawTFForcastInfo() {
    var typhoonFeature;

    //第一步：画出预测台风标注点
    for (var i = 0; i < tfForcastInfoArray.length; i++) {
        var simplePntInfo = tfForcastInfoArray[i]; //单个预测点
        var lon = simplePntInfo.jindu;
        var lat = simplePntInfo.weidu;
        var coord = [lon, lat]; //预测点坐标
        var n = 0;
        var tfGrade = 5;    //若无台风风力，则默认为热带气压
        var imgURL = "";
        if (simplePntInfo.windstrong != null) {
            n = simplePntInfo.windstrong.indexOf("级");
            tfGrade = simplePntInfo.windstrong.slice(0, n);
        }
        if (tfGrade == 4 || tfGrade == 5 || tfGrade == 6 || tfGrade == "         ") {
            imgURL = "Wind06.abc2d8bd.png";
        }
        if (tfGrade == 7) {                             //热带气压
            imgURL = "Wind06.abc2d8bd.png";
        } else if (tfGrade == 8 || tfGrade == 9) {      //热带风暴
            imgURL = "Wind05.99c53e33.png";
        } else if (tfGrade == 10 || tfGrade == 11) {    //强热带风暴
            imgURL = "Wind04.64ec73c1.png";
        } else if (tfGrade == 12 || tfGrade == 13) {    //台风
            imgURL = "Wind03.b4f7b7e4.png";
        } else if (tfGrade == 14 || tfGrade == 15) {    //强台风
            imgURL = "Wind02.6a5e9ea6.png";
        } else if (tfGrade == 16) {                     //超强台风
            imgURL = "Wind01.0c638630.png";
        }

        //添加预测台风路径点，即新建标注（Vector要素）并添加到地图容器中
        typhoonFeature = new Feature({
            geometry: new Point(coord), //几何信息（坐标点）
            //            name: resInfoArray[i].SiteName,  //名称属性
            type: "typhoon",  //类型（台风）
            info: simplePntInfo,  //标注的详细信息
            imgURL: imgURL,  //标注图标的URL地址
            fid: "typhoonPoint" + i.toString()
        });
        
        typhoonFeature.setStyle(createLabelStyle(imgURL, 0.8));
        tfljPntInfoLayer.getSource().addFeature(typhoonFeature);

        if (tfMarkerArray == null) {
            tfMarkerArray = new Array();
        }
        tfMarkerArray.push(typhoonFeature);
    }

    //第二步：画出预测台风路径线
    var dots1 = new Array();
    var dots2 = new Array();
    var dots3 = new Array();
    var dots4 = new Array();

    dots1.push([tfDetailInfoArray[tfDetailInfoArray.length - 1].jindu, tfDetailInfoArray[tfDetailInfoArray.length - 1].weidu]);
    dots2.push([tfDetailInfoArray[tfDetailInfoArray.length - 1].jindu, tfDetailInfoArray[tfDetailInfoArray.length - 1].weidu]);
    dots3.push([tfDetailInfoArray[tfDetailInfoArray.length - 1].jindu, tfDetailInfoArray[tfDetailInfoArray.length - 1].weidu]);
    dots4.push([tfDetailInfoArray[tfDetailInfoArray.length - 1].jindu, tfDetailInfoArray[tfDetailInfoArray.length - 1].weidu]);

    var dot = null;
    for (var i = 0; i < tfForcastInfoArray.length; i++) {
        var forecast = tfForcastInfoArray[i].forecast.slice(0, tfForcastInfoArray[i].forecast.indexOf(" ")); //国家属性
        dot = [tfForcastInfoArray[i].jindu, tfForcastInfoArray[i].weidu]; //台风预测点
        switch (forecast) {
            case "中国":
                dots1.push(dot);
                break;
            case "日本":
                dots2.push(dot);
                break;
            case "中国台湾":
                dots3.push(dot);
                break;
            case "美国":
                dots4.push(dot);
                break;
            default:
                break;
        }
    }

    var linFeature1 = new Feature({
        geometry: new LineString(dots1) // 中国大陆预测线几何信息
    });
    //设置线1的样式
    linFeature1.setStyle(new Style({
        stroke: new Stroke({
            color: '#FF3C4E',
            lineDash: [5, 5],
            width: 1
        })
    })
    );
    var linFeature2 = new Feature({
        geometry: new LineString(dots2) //日本预测线几何信息
    });
    //设置线2的样式
    linFeature2.setStyle(new Style({
        stroke: new Stroke({
            color: '#04FAF7',
            lineDash: [5, 5],
            width: 1
        })
    })
    );
    var linFeature3 = new Feature({
        geometry: new LineString(dots3) //中国台湾预测线几何信息
    });
    //设置线3的样式
    linFeature3.setStyle(new Style({
        stroke: new Stroke({
            color: '#FF00FE',
            lineDash: [5, 5],
            width: 1
        })
    })
    );
    var linFeature4 = new Feature({
        geometry: new LineString(dots4) //美国预测线几何信息
    });
    //设置线4的样式
    linFeature4.setStyle(new Style({
        stroke: new Stroke({
            color: '#FEBD00',
            lineDash: [5, 5],
            width: 1
        })
    })
    );
    //添加线要素
    tfljPathInfoLayer.getSource().addFeatures([linFeature1, linFeature2, linFeature3, linFeature4]);
}

/*
*	画出台风的详细路径信息
*@author fmm 2015-06-18
*/
function drawTFPathInfo(resInfoArray) {
    if (tfljPathInfoLayer == null) {   //将台风路径信息图层加入到地图容器       
        tfljPathInfoLayer = new VectorLayer({
            source: new VectorSource()
        });
        map.addLayer(tfljPathInfoLayer);
    }

    if (tfVectorLayer == null) {       //将当前台风标识绘制层添加到地图容器       
        tfVectorLayer = new VectorLayer({
            source: new VectorSource()
        });
        map.addLayer(tfVectorLayer);
    }

    if (tfljPntInfoLayer == null) {    //将台风点信息图层加入到地图容器
        tfljPntInfoLayer = new VectorLayer({
            source: new VectorSource()
        });
        map.addLayer(tfljPntInfoLayer);

    }
    //将地图中心移到第一个点的位置，并将地图级数放大两级
    map.getView().setCenter([resInfoArray[0].jindu, resInfoArray[0].weidu]);
    map.getView().setZoom(7);
    //设置计时器动态绘制路径点与路径线
    var i = 0;
    tfInfoTimer = setInterval(function () {
        if (i < resInfoArray.length) {
            addTFPath(i, resInfoArray[i++]); //绘制台风路径点与路径线
        }
        else {
            drawTFForcastInfo();             //绘制台风的预测路径信息
            if (tfInfoTimer != null) {
                clearInterval(tfInfoTimer);
                tfInfoTimer = null;
            }
        }
    }, 300);
}


/*
*	清除台风路径绘制信息
*@author fmm 2015-06-18
*/
function clearTfljPath() {
    if (tfljPathInfoLayer != null) {
        tfljPathInfoLayer.getSource().clear();      //清除路径信息
    }
    tfPathInfoArray = null;
}

/*
*	清除台风路径绘制路径时间控制器
*@author fmm 2015-06-18
*/
function clearTimer() {
    if (tfInfoTimer != null) {
        clearInterval(tfInfoTimer);
        tfInfoTimer = null;
    }
}

/*
*	清除台风图片周围的圆圈
*@author fmm 2015-07-14
*/
function clearTFCurrentCircle() {

    if (tfVectorLayer == null) {
        return;
    }
    else {
        var vectSource = tfVectorLayer.getSource();
        var features = vectSource.getFeatures();
        if (features != null) {
            tfVectorLayer.getSource().clear(); //清除所有要素
            tfCurrentCircle1 = null;
            tfCurrentCircle2 = null;
        }
    }
}

/**
* 创建标注样式函数
* author zjh 2019-01-07
* @param {string} imgURL image图标URL
* @param {number} image图标缩放比
*/
var createLabelStyle = function (imgURL, scale) {
    return new Style ({
        image: new Icon ({
            anchor: [0.5, 0.5],
            anchorOrigin: 'top-right',
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            offsetOrigin: 'top-right',
            // offset:[-7.5,-15],
            scale: scale,  //图标缩放比例
            opacity: 1,  //透明度
            src: imgURL  //图标的url
        })
    });
}