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
var length2
let compentSiteInfo=[];
// 定义抓取函数
async function scrapeCountryData(countryList,type,length,baseUrl) {

	var count=1;  //第几个Url
	length2=length;

	for(const country of countryList) { 	//不同国家
		console.log("当前总共有",length2,"个国家的",type,"数据待处理")

		let currentPage=1;
		let hasNextPage=true;
		let allCountrysSiteLinksTota=[];//存单个国家全部站点

		await delay(1000);

		while(hasNextPage) {  //同一个国家下面的不同页面
			// 构建页面URL
			const url=`${baseUrl}/${country}?page=${currentPage}`;

			console.log(`Loading: ${url},第:`,count,'个');



			// 使用Puppeteer加载页面
			const browser=await puppeteer.launch({
				headless: true,
				args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu',
					'--window-size=80,80']  // 其他可能的启动参数
			});

			// 定义模拟加载缓存
			const page=await browser.newPage();


			// 监听请求失败事件
			page.on('requestfailed',request => {
				// console.log(`Request failed: ${request.url()}`);
				// console.log(`Failure reason: ${request.failure().errorText}`);
			});

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
			await page.setViewport({ width: 80,height: 80 });
			await page.evaluate(() => {
				Object.defineProperty(navigator,'webdriver',{
					get: () => false,
				});
			});




			try {
				await page.goto(url,{ waitUntil: 'networkidle2',timeout: 90000 });  //加载同一个国家下的不同页清单
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
					// 保存txt方法
					fileAppender.appendToFile(`data/所有${type}站点清单.txt`,href,(err) => {
						if(err) {
							console.error('追加文本时出错:',err);
						} else {
							// console.log('站点TXT保存:',href);
						}
					});
				}

			});

			// allCountrysSiteLinksTota.push(links)
			allCountrysSiteLinksTota=allCountrysSiteLinksTota.concat(links)
			// console.log("allCountrysSiteLinksTota",allCountrysSiteLinksTota)


			console.log(`Found ${links.length} ${type} links on page ${currentPage} of ${country}.`);

			// 处理链接（模拟点击和加载页面）
			// for(const link of links) {

			// 	console.log(`Loading link: ${link}`);

			// 	try {
			// 		// 加载页面
			// 		const response=await page.goto(`${link}`,{ waitUntil: 'networkidle2' });

			// 		// 获取HTTP状态码
			// 		const status=response.status();
			// 		console.log(`HTTP Status Code: ${status}`);

			// 		// 检查页面是否加载成功
			// 		if(status>=200&&status<300) {
			// 			console.log('Page loaded successfully');

			// 			await delay(100);
			// 			// 等待页面中的数据完全加载
			// 			// await page.waitForTimeout(3000);  // 等待3秒钟
			// 			// 你可以在这里进一步处理页面内容...
			// 			await new Promise(resolve => setTimeout(resolve,500)); // 延迟1秒

						// // 处理点击事件
						// await page.evaluate(() => {
						// 	const container=document.querySelector('.enf-company-profile-info-main-spec.position-relative');
						// 	// <div class="enf-company-profile-info-main-spec position-relative"></div>
						// 	// <div class="enf-company-profile-info-main-spec position-relative"></div>

						// 	if(!container) return;

						// 	// 查找带有onclick属性的元素并点击全部
						// 	const clickableElements=container.querySelectorAll('[onclick]');

						// 	clickableElements.forEach(element => {
						// 		// 模拟点击事件
						// 		element.click();
						// 		console.log("模拟点击电话邮箱",element)
						// 		// 可选：等待每次点击后的内容加载，避免过快点击导致内容没有加载

						// 	});
						// });

			// 			await new Promise(resolve => setTimeout(resolve,1000));  // 等待1秒

			// 			// 等待点击后的内容加载
			// 			// await page.waitForTimeout(1000);  // 再等待3秒钟，确保内容加载
			// 			// await new Promise(resolve => setTimeout(resolve,500)); // 延迟1秒

			// 			// 获取指定元素下的表格内容
			// 			const sitedata=await page.evaluate(() => {

			// 				// 选择包含表格的容器元素
			// 				const container=document.querySelector('.enf-company-profile-info-main-spec.position-relative');
			// 				if(!container) return {};


			// 				const tables=container.querySelectorAll('table');

			// 				console.log("container:",container,tables)

			// 				// 获取第一个table下带有itemprop="address"的td元素的内容
			// 				const address=tables[0]?.querySelector('td[itemprop="address"]')?.textContent?.trim()||'无';

			// 				// 获取第二个table下带有itemprop="telephone"的<td>标签
			// 				const telephoneTd=tables[1]?.querySelector('td[itemprop="telephone"]');
			// 				const telephone=telephoneTd?
			// 					(telephoneTd.querySelector('a')?.getAttribute('href')||telephoneTd.textContent.trim())
			// 					:'无';
			// 				// console.log("ss",telephone)

			// 				// 在整个container下的所有table中搜索itemprop="url"的<a>标签的href属性值
			// 				const urlElement=container.querySelector('table a[itemprop="url"]');
			// 				const url=urlElement?.getAttribute('href')||'无';
			// 				// console.log("ss",url)

			// 				// 获取最后一个table下第二个td的内容并移除img元素
			// 				let additionalInfo='';
			// 				const lastTable=tables[tables.length-1];
			// 				if(lastTable) {
			// 					const lastTableTd=lastTable.querySelectorAll('td')[1];
			// 					if(lastTableTd) {
			// 						const imgs=lastTableTd.querySelectorAll('img');
			// 						imgs.forEach(img => img.remove());
			// 						additionalInfo=lastTableTd.textContent.trim();
			// 					}
			// 				}


			// 				let email='无';
			// 				// 查找带有itemprop="email"的<td>标签
			// 				const emailTd=container.querySelector('td[itemprop="email"]');
			// 				if(!emailTd) return '无';

			// 				// 查找<td>标签下的<a>标签
			// 				const emailAnchor=emailTd.querySelector('a');
			// 				if(emailAnchor) {
			// 					// 返回<a>标签的href属性值
			// 					email=emailAnchor.getAttribute('href')||emailAnchor.textContent.trim();
			// 				} else {
			// 					// 如果没有<a>标签，返回<td>标签的文本内容
			// 					email=emailTd.textContent.trim();
			// 				}

			// 				const emailWithMailto=email;
			// 				const Email=emailWithMailto.replace(/^mailto:/i,'');

			// 				return { address,telephone,Email,url,additionalInfo };
			// 			});

			// 			// console.log("站点信息：",sitedata)

			// 			// 追加获取的站点联系方式信息
			// 			compentSiteInfo.push(sitedata)

			// 			// 对象数据生成文本内容，并且加上换行
			// 			const textContent=formatDataToText(sitedata);
			// 			// 保存txt方法
			// 			fileAppender.appendToFile(`data/所有${type}站点信息.txt`,textContent,(err) => {
			// 				if(err) {
			// 					console.error('追加文本时出错:',err);
			// 				} else {
			// 					console.log(type+'站点信息TXT保存完成:',textContent);
			// 				}
			// 			});


			// 			await new Promise(resolve => setTimeout(resolve,500)); // 延迟1秒
			// 		} else {
			// 			console.log('Failed to load the page');
			// 		}
			// 	} catch(error) {
			// 		console.log('Error loading the page:',error);
			// 	} finally {
			// 		// await browser.close();
			// 	}

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
			
			count++;

		}

		length2--;
		console.log("当前国家",country,"的",type,"站点信息全部取出:",allCountrysSiteLinksTota.length)
		console.log("当前总共还有",length2,"个国家的",type,"数据待处理\n")

		let countrySites={
			"countryName": country,
			"type":type,
			"href": allCountrysSiteLinksTota
		}
		allSiteTemp.push(countrySites);	//单个国家数据追加


	}

	console.log(`所有国家的${type} 联系方式:${compentSiteInfo}`)
	// 生成 Excel 文件
	exportToExcel(compentSiteInfo,`data/全部国家${type}联系信息.xlsx`);

	let tempAlllinks=allSiteTemp
	allSiteTemp=[];

	return tempAlllinks;
}

// 延时方法
async function delay(ms) {
	console.log("延时",ms,"ms")
	return new Promise(resolve => setTimeout(resolve,ms));
}


// 将对象数据转换为文本格式
const formatDataToText=(obj) => {
	// 格式化输出

	const hour=now.getHours();
	const minute=now.getMinutes();
	const second=now.getSeconds();

	// 格式化输出
	const currentTime=`${year}-${month}-${day} ${hour}:${minute}:${second}`;

	return Object.entries(obj)
		.map(([key,value]) => `${key}: ${value}`)
		.join('\n')+'\n'+currentTime+'\n';
};


// 模块导出
module.exports={ scrapeCountryData };



