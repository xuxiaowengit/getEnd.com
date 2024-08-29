// scraper.js
const axios=require('axios');
const cheerio=require('cheerio');
const puppeteer=require('puppeteer');
let allSiteTemp=[];
var length2

// 定义抓取函数
async function scrapeCountryData(countryList,type,length,baseUrl) {
	
	// const baseUrl='https://www.enf.com.cn/directory/installer/';
	
	 length2=length;
	console.log("当前总共有",length2,"个国家的",type,"数据待处理")

	for(const country of countryList) { 	//不同国家
		let currentPage=1;
		let hasNextPage=true;
		let allCountrysSiteLinksTota=[];//存单个国家全部站点
		
		// await delay(1000);

		while(hasNextPage) {  //同一个国家下面的不同页面
			// 构建页面URL
			const url=`${baseUrl}/${country}?page=${currentPage}`;
			console.log(`Loading: ${url}`);

			// 使用Puppeteer加载页面
			const browser=await puppeteer.launch({ headless: true });
			
			
			const page=await browser.newPage();
			
			
			//模拟浏览器行为
			await page.setRequestInterception(true);
			page.on('request',request => {
				if(['image','stylesheet','font'].includes(request.resourceType())) {
					request.abort();
				} else {
					request.continue();
				}
			});
			await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
			await page.setViewport({ width: 1280,height: 800 });
			await page.evaluate(() => {
				Object.defineProperty(navigator,'webdriver',{
					get: () => false,
				});
			});

			try {
				await page.goto(url,{ waitUntil: 'networkidle2',timeout: 90000 });
				await delay(1000);
			} catch(error) {
				console.error('Failed to navigate:',error);
			}
			
			
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
		console.log("当前总共还有",length2,"个国家的",type,"数据待处理\n")

		let countrySites={
			"countryName": country,
			"href": allCountrysSiteLinksTota
		}
		allSiteTemp.push(countrySites);	//单个国家数据追加
		
		
	}
	
	let tempAlllinks=allSiteTemp
	allSiteTemp=[];
	return tempAlllinks;
}

// 延时方法
async function delay(ms) {
	console.log("延时",ms,"ms")
	return new Promise(resolve => setTimeout(resolve,ms));
}

// 模块导出
module.exports={ scrapeCountryData };



