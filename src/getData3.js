// scraper.js
const axios=require('axios');
const cheerio=require('cheerio');
const puppeteer=require('puppeteer');
const fileAppender=require('./filetxt');
const exportToExcel=require('./exportToExcel');

const now=new Date();
// 获取年、月、日、小时、分钟、秒
const year=now.getFullYear();
const month=now.getMonth()+1; // 月份是从0开始的，所以需要加1
const day=now.getDate();

let allSiteTemp=[];
let compentSiteInfo=[];
let totalCountries;


// 定义抓取函数
async function scrapeCountryData(countryList,type,length,baseUrl) {
	let processedCount=0;
	totalCountries=length;
	console.log(`当前总共有 ${totalCountries} 个国家的 ${type} 数据待处理`);

	// 启动浏览器
	const browser=await puppeteer.launch({
		headless: true,
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-gpu',
			'--window-size=80,80',
		],
	});

	const page=await browser.newPage();

	// 设置请求拦截，阻止加载不必要的资源
	await page.setRequestInterception(true);
	page.on('request',(request) => {
		const resourceType=request.resourceType();
		if(['image','stylesheet','font','media'].includes(resourceType)) {
			request.abort();
		} else {
			request.continue();
		}
	});

	// 设置User-Agent和视口
	await page.setUserAgent(
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
	);
	await page.setViewport({ width: 1280,height: 800 });

	for(const country of countryList) {
		let currentPage=1;
		let hasNextPage=true;
		let allCountrysSiteLinksTotal=[];

		console.log(`开始处理国家：${country}`);

		while(hasNextPage) {
			const url=`${baseUrl}/${country}?page=${currentPage}`;
			console.log(`正在加载：${url}`);

			try {
				const response=await page.goto(url,{
					waitUntil: 'domcontentloaded',
					timeout: 60000,
				});

				const status=response.status();
				if(status!==200) {
					console.warn(`无法加载清单页面，状态码：${status}`);
					break;
				}

				const content=await page.content();
				const $=cheerio.load(content);

				// 提取所有站点链接
				const links=[];
				$('table.enf-list-table tbody td a').each((index,element) => {
					const href=$(element).attr('href');
					if(href) {
						links.push(href);
						// 保存到TXT文件
						fileAppender.appendToFile(
							`data/所有${type}站点清单.txt`,
							`${href}\n`,
							(err) => {
								if(err) {
									console.error('追加文本时出错:',err);
								} else {
									
								}
							}
						);
					}
				});

				console.log(`在第 ${currentPage} 页共找到 ${links.length} 个链接。已全部保存到data/所有${ type }站点清单.txt`);

				// 处理每个链接，提取详细信息
				// for(const link of links) {
				// 	console.log(`正在处理链接：${link}`);
				// 	try {
				// 		const detailResponse=await page.goto(link,{
				// 			waitUntil: 'domcontentloaded',
				// 			timeout: 60000,
				// 		});

				// 		const detailStatus=detailResponse.status();
				// 		if(detailStatus!==200) {
				// 			console.warn(`无法加载详情页，状态码：${detailStatus}`);
				// 			continue;
				// 		}

				// 		// 等待必要的元素加载完成
				// 		await page.waitForSelector(
				// 			'.enf-company-profile-info-main-spec.position-relative',
				// 			{ timeout: 10000 }
				// 		);

				// 		// 展开隐藏的信息（如电话、邮箱）
				// 		await page.evaluate(() => {
				// 			const container=document.querySelector(
				// 				'.enf-company-profile-info-main-spec.position-relative'
				// 			);
				// 			if(container) {
				// 				const clickableElements=container.querySelectorAll('[onclick]');
				// 				clickableElements.forEach((element) => element.click());
				// 			}
				// 		});

				// 		// 提取详细信息
				// 		const siteData=await page.evaluate(() => {
				// 			const container=document.querySelector(
				// 				'.enf-company-profile-info-main-spec.position-relative'
				// 			);
				// 			if(!container) return {};

				// 			const address=
				// 				container.querySelector('td[itemprop="address"]')?.innerText.trim()||
				// 				'无';
				// 			const telephone=
				// 				container.querySelector('td[itemprop="telephone"] a')?.innerText.trim()||
				// 				'无';
				// 			const email=
				// 				container
				// 					.querySelector('td[itemprop="email"] a')
				// 					?.getAttribute('href')
				// 					.replace('mailto:','')||'无';
				// 			const url=
				// 				container.querySelector('a[itemprop="url"]')?.getAttribute('href')||
				// 				'无';
				// 			const additionalInfo=
				// 				container
				// 					.querySelector('table:last-of-type td:nth-child(2)')
				// 					?.innerText.trim()||'无';

				// 			return { address,telephone,email,url,additionalInfo };
				// 		});

				// 		// 保存数据到数组
				// 		compentSiteInfo.push(siteData);

				// 		// 保存到TXT文件
				// 		const textContent=formatDataToText(siteData);
				// 		fileAppender.appendToFile(
				// 			`data/所有${type}站点信息.txt`,
				// 			textContent,
				// 			(err) => {
				// 				if(err) {
				// 					console.error('追加文本时出错:',err);
				// 				} else {
				// 					console.log(`${type}站点：${link}，信息已保存`);
				// 				}
				// 			}
				// 		);

				// 		// 避免请求过于频繁，添加短暂延迟
				// 		await delay(500);
				// 	} catch(error) {
				// 		console.error(`处理链接时出错：${link}`,error);
				// 	}
				// }

				// 判断是否有下一页
				hasNextPage=await page.$('ul.pagination.enf-pagination li i.fa.fa-chevron-right')!==null;
				if(hasNextPage) {
					currentPage++;
				} else {
					console.log(`国家 ${country} 的所有页面已处理完毕。`);
				}
			} catch(error) {
				console.error(`加载页面时出错：${url}`,error);
				hasNextPage=false;
			}
		}

		// 汇总当前国家的数据
		allSiteTemp.push({
			countryName: country,
			href: allCountrysSiteLinksTotal,
		});

		processedCount++;
		console.log(
			`已完成 ${processedCount}/${totalCountries} 个国家的 ${type} 数据处理。\n`
		);
	}

	// 关闭浏览器
	await browser.close();

	// 导出数据到Excel
	exportToExcel(compentSiteInfo,`data/全部国家${type}联系信息.xlsx`);
	console.log(`所有国家的${type} 联系方式已导出到Excel文件。`);

	// 重置临时数据
	const tempAllLinks=[...allSiteTemp];
	allSiteTemp=[];
	compentSiteInfo=[];

	return tempAllLinks;
}

// 延时方法
async function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve,ms));
}

// 将对象数据转换为文本格式
function formatDataToText(obj) {
	const hour=now.getHours();
	const minute=now.getMinutes();
	const second=now.getSeconds();
	const currentTime=`${year}-${month}-${day} ${hour}:${minute}:${second}`;

	return (
		Object.entries(obj)
			.map(([key,value]) => `${key}: ${value}`)
			.join('\n')+
		`\n抓取时间: ${currentTime}\n`
	);
}

// 模块导出
module.exports={ scrapeCountryData };
