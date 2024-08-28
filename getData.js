// scraper.js
const axios=require('axios');
const cheerio=require('cheerio');
const puppeteer=require('puppeteer');
const allSiteTemp=[];
var length2

// 定义抓取函数
async function scrapeCountryData(countryList,type,length) {
	
	const baseUrl='https://www.enf.com.cn/directory/installer/';
	 length2=length;
	console.log("当前总共有",length2,"个国家的",type,"数据待处理")

	for(const country of countryList) { 	//不同国家
		let currentPage=1;
		let hasNextPage=true;
		let allCountrysSiteLinksTota=[];//存单个国家全部站点
		
		// await delay(1000);

		while(hasNextPage) {  //同一个国家下面的不同页面
			// 构建页面URL
			const url=`${baseUrl}${country}?page=${currentPage}`;
			console.log(`Loading: ${url}`);

			// 使用Puppeteer加载页面
			const browser=await puppeteer.launch({ headless: true });
			const page=await browser.newPage();
			await page.goto(url,{ waitUntil: 'networkidle2',timeout: 60000 });
			await delay(1000);
			
			// 获取页面内容
			const content=await page.content();
			const $=cheerio.load(content);

			// 提取所有 <a> 标签的 href 属性
			const links=[];
			$('table.enf-list-table tbody td a').each((index,element) => {
				const href=$(element).attr('href');
				if(href) {
					links.push(href);
				}
				
			});
			
			// allCountrysSiteLinksTota.push(links)
			allCountrysSiteLinksTota=allCountrysSiteLinksTota.concat(links)
			// console.log("allCountrysSiteLinksTota",allCountrysSiteLinksTota)
			

			console.log(`Found ${links.length} ${type} links on page ${currentPage} of ${country}.`);

			// // 处理链接（模拟点击和加载页面）
			// for(const link of links) {
			// 	console.log(`Loading link: ${link}`);
			// 	await page.goto(`https://www.enf.com.cn${link}`,{ waitUntil: 'networkidle2' });
			// 	// 你可以在这里进一步处理页面内容...
			// 	await new Promise(resolve => setTimeout(resolve,1000)); // 延迟1秒
			// }

			// 判断是否有下一页
			const nextPageButton=$('ul.pagination.enf-pagination li i.fa.fa-chevron-right');
			hasNextPage=nextPageButton.length>0;
			if(hasNextPage) {
				currentPage++;
			} else {
				console.log("当前国家只有",currentPage,"页站点信息！")
			}

			await browser.close();
			
		}
		length2--;
		console.log("当前国家",country,"的",type,"站点信息全部取出:",allCountrysSiteLinksTota.length)
		console.log("当前总共还有",length2,"个国家的",type,"数据待处理")

		let countrySites={
			"countryName": country,
			"href": allCountrysSiteLinksTota
		}
		allSiteTemp.push(countrySites);	
		
		
	}
	
	
	return allSiteTemp;
}

// 延时方法
async function delay(ms) {
	console.log("延时",ms,"ms")
	return new Promise(resolve => setTimeout(resolve,ms));
}

// 模块导出
module.exports={ scrapeCountryData };



