import axios from "axios";
import qs from "qs";
import { getStore,removestore } from "../libs/storage.js";


axios.defaults.baseURL="/api"


export function get(url,params){
    const token=getStore('token');

    return axios({
        method:'get',
        url:`${url}`,       
        params:params,
        headers:{
            'token':token
        }
    }
    )
}

export function post(url,params){
    const token=getStore('token');
    
    return axios({
        method:'post',
        url:`${url}`,
        data:params,
        transformRequest:[function (data){
            return qs.stringify(data,{allowDots:true})
        }],
        headers:{
            'Content-Type':'application/x-www-form-urlencoded',
            'token':token
        }
    })
}

export function postJson(url,params){
    const token=getStore('token');

    return axios({
        method:'post',
        url:`${url}`,
        data:params,
        headers:{
            'Content-Type':'application/json',
            'token':token
        }
    })
}

export function put(url,params){
    const token=getStore('token');

    return axios({
        method:'put',
        url:`${url}`,
        data:params,
        headers:{
            'Content-Type':'application/json',
            'token':token
        }
    })
}

export function del(url,params){
    const token=getStore('token');

    return axios({
        method:'delete',
        url:`${url}`,
        data:params,
        headers:{
            'Content-Type':'application/json',
            'token':token
        }
    })
}

axios.interceptors.response.use(res=>{
    const result=res.data;
    const code=result.statusCode
    switch(code){
        case '200':{
            return Promise.resolve(result)
        }
        case '400':{
            return Promise.reject("操作失败："+result.message)
        }
        case '401':{
            removestore('token');
            removestore('userInfo');
            window.location.href = '/'; 
            return new Promise(()=>{});
        }
        case '404':{
            return Promise.reject('接口不存在')
        }
        case '500':{
            return Promise.reject('服务器错误')
        }
        case '600':{
            return Promise.reject('请重新登录')
        }
        default:{
            return Promise.reject(result.message)
        }
    }
},err =>{
    if (err.response && err.response.status === 401) {
        removestore('token');
        removestore('userInfo');
        removestore('username');
        removestore('userType');
        removestore('avater');
        window.location.href = '/';
        return new Promise(() => {});
    }
    return Promise.reject(err);
}
)