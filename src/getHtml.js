const { scrapeCountryData }=require('./getData');
const { saveArrayToJson }=require('./outJson');




const axios=require('axios');
const cheerio=require('cheerio');
const { fontFamily }=require('excel4node/distribution/lib/types');
var countrys=0;
let installerCountrylinks=[];
let salesCountrylinks=[];
const url='https://www.enf.com.cn/directory/installer';  //安装商查询页

 

const scrapeLinks=async () => {
	// 安装商保存文件名和目录
	
	const directory='./json/'; // 保存到当前目录，你可以指定其他目录

	try {
		// 发起 HTTP 请求
		const { data }=await axios.get(url,{
		
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'
			}
		});

		// 加载 HTML 数据
		const $=cheerio.load(data);

		// 选择指定的 <ul> 元素
		const $ul=$('div.mk-body ul.list-unstyled');

		// 提取所有 <a> 标签的 href 属性
		const links=[];
		$ul.find('a').each((i,elem) => {
			const href=$(elem).attr('href');
			if(href) { //&& links.length <=2
				const lastSegment=href.split('/').pop();  
				links.push(lastSegment);
				// console.log(`Link1: ${i+1}: ${href}`); // 输出当前链接
			}
		});
		
		installerCountrylinks=links; //全部国家名称
		
		// 打印所有提取的链接
		// console.log('All Extracted Links:',links,links.length);
		console.log('全部安装商国家数量:',links.length);
		countrys=countrys+links.length;
	
	 
		
	} catch(error) {
		console.error('Error scraping data:',error.message);
	} finally {
		console.log("installerCountrylinks:",installerCountrylinks.length)
		// 调用输出json文件模块函数
		saveArrayToJson(installerCountrylinks,'installersCountrysData.json',directory);
		
		// 测试时切掉数组指定长度外的数据
		installerCountrylinks.splice(0,installerCountrylinks.length- 3);
		
		console.log("installerCountrylinks-测试长度:",installerCountrylinks.length)
		
		// // 调用抓取函数
		scrapeCountryData(installerCountrylinks,"安装商",installerCountrylinks.length,url)
			.then((resData) => {
				// console.log('Scraping completed.数据:',resData);
				// 保存取出的全部国家安装商站点信息
				saveArrayToJson(resData,"installerCountryAllLinks.json",directory);
			})
			.catch(err => {
				console.error('Error occurred:',err);
			}).finally(() => {
				// 这里执行无论成功或失败都需要执行的代码  
				// console.log('Cleanup or final operations.');
				// 执行爬虫2
				// scrapeLinks2();
			});
		
		
		
	}
};






// 要爬取的经销商网址 
const url2='https://www.enf.com.cn/directory/seller';

const scrapeLinks2=async (res) => {
	// 经销商保存文件名和目录
	
	const directory='./json/'; // 保存到当前目录，你可以指定其他目录
	try {
		// 发起 HTTP 请求
		const { data }=await axios.get(url2,{
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'
			}
		});
		
		// 打出网页数据
		// console.log("网页数据:",data)

		// 加载 HTML 数据
		const $=cheerio.load(data);

		// 选择指定的 <div> 元素
		const $div=$('div.mk-body');

		// 提取所有 <li class="pull-left"> 元素下的 <a> 标签的 href 属性
		const links=[];
		$div.find('li.pull-left a').each((i,elem) => {
			const href=$(elem).attr('href');
			if(href) {
				const lastSegment=href.split('/').pop();
				links.push(lastSegment);
				// const lastSegment=href.split('/').pop();
				// links.push(lastSegment);
				// console.log(`Link2: ${i+1}: ${href}`); // 输出当前链接
			}
		});
		
		salesCountrylinks=links;//全部国家名称

		// 打印所有提取的链接
		// console.log('All Extracted Links:',links,links.length);
		console.log('全部经销商国家数量:',links.length);
		countrys=countrys+links.length;

	} catch(error) {
		console.error('Post Error scraping data:',error.message);
	} finally {
		console.log("salesCountrylinks:",salesCountrylinks.length)
		
		
		// 调用模块函数保存经销商国家清单
		saveArrayToJson(salesCountrylinks,'salesCountrysData.json',directory);
		
		console.log("全部潜在客户国家数量:",countrys)
		
		// 测试时切掉数组指定长度外的数据
		salesCountrylinks.splice(0,salesCountrylinks.length- 3);
		
		
		// // 调用抓取函数
		scrapeCountryData(salesCountrylinks,"经销商",salesCountrylinks.length,url2)
			.then((resData) => {
				// console.log('Scraping completed.数据:',resData);
				// 保存取出的全部国家经销商站点信息
				saveArrayToJson(resData,"salesCountryAllLinks.json",directory);
			})
			.catch(err => {
				console.error('Error occurred:',err);
			}).finally(() => {
				// 这里执行无论成功或失败都需要执行的代码  
				// console.log('Cleanup or final operations.');
				// 执行爬虫2
				scrapeLinks();
			});

	}
}; 


// 执行爬虫
scrapeLinks2();