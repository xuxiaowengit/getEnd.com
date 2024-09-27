const axios=require('axios');
const cheerio=require('cheerio');
const puppeteer=require('puppeteer');
const fileAppender=require('../src/filetxt');
const exportToExcel=require('../src/exportToExcel');

const now=new Date();
const year=now.getFullYear();
const month=now.getMonth()+1;
const day=now.getDate();

let allSiteTemp=[];
var length2;

let compentSiteInfo=[];

// 定义抓取函数
async function scrapeCountryData(countryList,type,length,baseUrl) {
	var count=1;
	length2=length;
	console.log("当前总共有",length2,"个国家的",type,"数据待处理");

	for(const country of countryList) {
		let currentPage=1;
		let hasNextPage=true;
		let allCountrysSiteLinksTota=[]; // 存单个国家全部站点

		while(hasNextPage) {  //加载同一个国家下面的不同页
			const url=`${baseUrl}/${country}?page=${currentPage}`;
			console.log(`Loading: ${url}, 第:`,count,'个');

			// 使用 Axios 加载页面，避免被服务器察觉
			try {
				const response=await axios.get(url);
				const $=cheerio.load(response.data);

				// 提取 <a> 标签的 href 属性
				const links=[];
				$('table.enf-list-table tbody td a').each((index,element) => {
					const href=$(element).attr('href');
					if(href) {
						links.push(href);
						fileAppender.appendToFile(`data/所有${type}站点清单.txt`,href,(err) => {
							if(err) {
								console.error('追加文本时出错:',err);
							}
						});
					}
				});

				allCountrysSiteLinksTota=allCountrysSiteLinksTota.concat(links);
				console.log(`Found ${links.length} ${type} links on page ${currentPage} of ${country}.`);

				// 针对每个链接，可能需要 Puppeteer 处理复杂页面
				for(const link of links) {
					console.log(`Loading link: ${link}`);
					const siteData=await processLinkWithPuppeteer(link,type);
					if(siteData) {
						compentSiteInfo.push(siteData);
						const textContent=formatDataToText(siteData);
						fileAppender.appendToFile(`data/所有${type}站点信息.txt`,textContent,(err) => {
							if(err) {
								console.error('追加文本时出错:',err);
							}
						});
					}
				}

				const nextPageButton=$('ul.pagination.enf-pagination li i.fa.fa-chevron-right');
				hasNextPage=nextPageButton.length>0;
				if(hasNextPage) {
					currentPage++;
				} else {
					console.log("当前国家只有",currentPage,"页站点信息！");
				}

			} catch(error) {
				console.error(`Error loading the page with Axios:`,error);
			}

			count++;
		}

		length2--;
		console.log("当前国家",country,"的",type,"站点信息全部取出:",allCountrysSiteLinksTota.length);
		console.log("当前总共还有",length2,"个国家的",type,"数据待处理\n");

		let countrySites={
			"countryName": country,
			"href": allCountrysSiteLinksTota
		};
		allSiteTemp.push(countrySites);
	}

	console.log(`所有国家的${type} 联系信息:${compentSiteInfo}`);
	exportToExcel(compentSiteInfo,`data/全部国家${type}联系信息.xlsx`);

	let tempAlllinks=allSiteTemp;
	allSiteTemp=[];
	return tempAlllinks;
}

// 使用 Puppeteer 处理需要动态加载或点击的页面
async function processLinkWithPuppeteer(link,type) {
	const browser=await puppeteer.launch({ headless: true });
	const page=await browser.newPage();

	try {
		await page.goto(link,{ waitUntil: 'networkidle2',timeout: 90000 });

		// 模拟点击，获取联系方式等信息
		const siteData=await page.evaluate(() => {
			const container=document.querySelector('.enf-company-profile-info-main-spec.position-relative');
			if(!container) return {};

			const address=container.querySelector('td[itemprop="address"]')?.textContent?.trim()||'无';
			const telephone=container.querySelector('td[itemprop="telephone"] a')?.textContent?.trim()||'无';
			const email=container.querySelector('td[itemprop="email"] a')?.textContent?.replace(/^mailto:/i,'')||'无';
			const url=container.querySelector('td[itemprop="url"] a')?.getAttribute('href')||'无';

			return { address,telephone,email,url };
		});

		await browser.close();
		return siteData;

	} catch(error) {
		console.error('Error loading the page with Puppeteer:',error);
		await browser.close();
		return null;
	}
}

// 延时方法
async function delay(ms) {
	console.log("延时",ms,"ms");
	return new Promise(resolve => setTimeout(resolve,ms));
}

// 将对象数据转换为文本格式
const formatDataToText=(obj) => {
	const hour=now.getHours();
	const minute=now.getMinutes();
	const second=now.getSeconds();
	const currentTime=`${year}-${month}-${day} ${hour}:${minute}:${second}`;

	return Object.entries(obj)
		.map(([key,value]) => `${key}: ${value}`)
		.join('\n')+'\n'+currentTime+'\n';
};

module.exports={ scrapeCountryData };
