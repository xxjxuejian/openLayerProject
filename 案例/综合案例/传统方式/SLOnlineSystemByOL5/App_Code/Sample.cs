using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Runtime.Serialization.Json;
using System.IO;
using System.Text;
using System.Data;
using System.Data.OleDb;
using System.Configuration;

/// <summary>
///Sample 的摘要说明
/// </summary>
public class Sample
{
    public Sample()
    {
    }

    #region 实时水情模块
    /// <summary>
    ///获取水位信息
    /// </summary>
    /// <returns></returns>
    public static string showWaterInfo(string type)
    {
        List<WaterInfo> listSite = DBConnection.getWaterInfos(type);
        string resInfo = ConvertToJson(listSite);
        return resInfo;
    }
    /// <summary>
    /// 站点水位信息
    /// </summary>
    /// <param name="type"></param>
    /// <param name="SiteNum"></param>
    /// <returns></returns>
    public static string showSiteWaterHisInfos(string type, int SiteNum)
    {
        List<WaterInfo> listSite = DBConnection.getWaterHisInfo(type, SiteNum);
        string resInfo = ConvertToJson(listSite);
        return resInfo;
    }
    #endregion

    #region 台风路径模块
    /// <summary>
    /// //获取台风基本信息
    /// </summary>
    /// <returns></returns>
    public static string showWindbasicInfo()
    {
        List<WindInfoDTO> listWindBasicInfo = DBConnection.ConnectSQLwind_basicinfo();
        string resInfo = ConvertToJson(listWindBasicInfo);
        return resInfo;
    }

    /// <summary>
    /// 获取台风预测信息
    /// </summary>
    /// <param name="winid"></param>
    /// <returns></returns>
    public static string showWindForcastInfo(int winid)
    {
        List<WindForecastDTO> listWindForecastInfo = DBConnection.ConnectSQLwindForecastInfo(winid);
        string resInfo = ConvertToJson(listWindForecastInfo);
        return resInfo;
    }

    /// <summary>
    /// 获取台风详细信息
    /// </summary>
    /// <param name="winid"></param>
    /// <returns></returns>
    public static string showWindDetailInfo(int winid)
    {

        List<WindDetailInfoDTO> listWindDetailInfo = DBConnection.ConnectSQLwindDetailInfo(winid);
        string resInfo = ConvertToJson(listWindDetailInfo);
        return resInfo;
    }
    #endregion

    

    #region 实时雨情模块
    /// <summary>
    /// 雨量信息
    /// </summary>
    /// <param name="StarTime"></param>
    /// <param name="EndTime"></param>
    /// <param name="MixNum"></param>
    /// <param name="MaxNum"></param>
    /// <returns></returns>
    public static string GetRainNums(string StarTime, string EndTime, double MixNum, double MaxNum)
    {
        List<RainInfo> listSite = DBConnection.getRainInfo(StarTime, EndTime, MixNum, MaxNum);
        string resInfo = ConvertToJson(listSite);
        return resInfo;
    }

    /// <summary>
    /// 站点雨量历史信息
    /// </summary>
    /// <param name="SiteNum"></param>
    /// <returns></returns>
    public static string GetSiteRainInfo(string StarTime, string EndTime, int SiteNum)
    {
        List<RainDetailInfo> listSite = DBConnection.getSiteHisRainInfos(StarTime, EndTime, SiteNum);
        string resInfo = ConvertToJson(listSite);
        return resInfo;
    }
    #endregion

    #region 私有方法
    /// <summary>
    /// 将对象转换成json返回给前台
    /// </summary>
    /// <param name="obj"></param>
    /// <returns></returns>
    private static string ConvertToJson(object obj)
    {
        DataContractJsonSerializer json = new DataContractJsonSerializer(obj.GetType());
        string resJson = "";
        using (MemoryStream stream = new MemoryStream())
        {
            json.WriteObject(stream, obj);
            resJson = Encoding.UTF8.GetString(stream.ToArray());
        }
        return resJson;
    }
    #endregion
}