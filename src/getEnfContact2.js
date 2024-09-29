const fs=require('fs');
const puppeteer=require('puppeteer');
const getEnfContact=require("./getEnfContact1.js")
// 记录连续失败次数
let failureCount=0;

// 延迟函数
const delay=ms => new Promise(resolve => setTimeout(resolve,ms));


// 从文件中读取链接并逐行处理
async function getEnfContact2() {
	const filePath='datain/所有经销商站点清单.txt'; // 文件路径
	const links=fs.readFileSync(filePath,'utf-8').split('\n').filter(link => link.trim());  //要在本身目录启动程序	

	for(const link of links) {
		console.log("总共还有"+links.length+"个经销商链接待处理！")
		console.log(`Loading link: ${link}`);
		// const url=link;
		const regex=/\.cn/;
		try {


			//  启动无头浏览器
			const browser=await puppeteer.launch({
				executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'  // 指定 Chrome 的安装路径
			});
			const page=await browser.newPage();

			const response=await page.goto(link,{ waitUntil: 'networkidle2' });

			const status=response.status();
			console.log(`HTTP2 Status Code: ${status}`);

			if(status>=200&&status<300) {
				// console.log('Page2 loaded successfully');

				// 确保容器内的所有 onclick 元素点击成功
				await page.evaluate(async () => {
					
					// 延迟函数
					var delay=ms => new Promise(resolve => setTimeout(resolve,ms));

					// 确保容器元素存在
					const container=document.querySelector('.enf-company-profile-info-main-spec ');
					if(!container) {
						console.log('找不到容器元素');
						return;
					}

					// 查找带有 onclick 属性的元素
					const clickableElements=container.querySelectorAll('[onclick]');
					if(clickableElements.length===0) {
						console.log('找不到任何带 onclick 属性的元素');
					}
					await delay(1000); // 暂停1小时
					
					for(const element of clickableElements) {
						// 确保元素是可见的
						const isVisible=element.offsetParent!==null;
						if(isVisible) {
							// 模拟点击事件
							const event=new MouseEvent('click',{ bubbles: true,cancelable: true,view: window });
							element.dispatchEvent(event);
							console.log('模拟点击',element);

							// 等待每次点击后的内容加载
							await new Promise(resolve => setTimeout(resolve,2000)); // 等待2秒，视需要调整

							// 检查点击后的内容是否变化
							const updatedTelephone=container.querySelector('td[itemprop="telephone"] span')?.textContent;
							if(updatedTelephone&&updatedTelephone!=='Click to show company phone') {
								console.log('电话号码已更新:',updatedTelephone);
								break; // 退出循环，电话号码已更新
							}
						} else {
							console.log('元素不可见',element);
						}
					}
				});

				// 等待点击后的页面内容加载
				// await page.waitFor(1000); // 等待2秒，视需要调整
				await delay(1000); // 延时1秒
				await new Promise(resolve => setTimeout(resolve,1000)); // 等待2秒，视需要调整

				// 获取页面数据
				const siteData=await page.evaluate(async () => {
					const container=document.querySelector('.enf-company-profile-info-main-spec.position-relative');
					if(!container) {
						return {}
					} else {

						// 获取地址
						const address=container.querySelector('td[itemprop="address"]')?.textContent?.trim()||'无';

						//获取电话
						const telephone=container.querySelector('td[itemprop="telephone"]')?.textContent?.trim()||'无';

						// 获取邮箱
						const emailElement=container.querySelector('td[itemprop="email"]'); //?.textContent?.trim()||'无'
						const email=emailElement? emailElement.textContent.trim():'无';
						console.log("email",email)
						const formattedEmail=email.startsWith('mailto:')? email.replace(/^mailto:/i,''):email;

					


						// 获取 URL
						const urlElement=container.querySelector('a[itemprop="url"]');
						const url=urlElement? urlElement.href:'无';

						// 获取附加信息
						let additionalInfo='';
						const lastTable=container.querySelectorAll('table');
						if(lastTable.length>0) {
							const lastTd=lastTable[lastTable.length-1].querySelectorAll('td')[1];
							if(lastTd) {
								const imgs=lastTd.querySelectorAll('img');
								imgs.forEach(img => img.remove()); // 移除不必要的 img 元素
								additionalInfo=lastTd.textContent.trim();
							}
						}


						return { address,telephone,formattedEmail,url,additionalInfo };
					}
				});


				console.log('Sales Site data:',siteData);
				if(regex.test(siteData.url&&siteData.formattedEmail)) {

					console.log("链接包含 .cn 字符,排除：",siteData.url,siteData.formattedEmail);
					
					// 删除该链接
					removeProcessedLink(link,filePath);
				} else {


					// 格式化数据并保存到文件
					const formattedData=`address: ${siteData.address}\ntelephone: ${siteData.telephone}\nemail: ${siteData.formattedEmail}\ntelephone: ${siteData.url}\ntelephone: ${siteData.additionalInfo}\n\n`;

					// 将格式化后的数据保存到文件
					fs.appendFileSync('data/获取的经销商联系信息.txt',formattedData);

					// 判断是否API超限了
					if(containsDailyLimitReached(siteData)) {
						console.log("api超限，保留该链接下次处理：",link)
						failureCount++;
					} else {
						// 处理后或删除该链接
						removeProcessedLink(link,filePath);
						failureCount=0; // 重置失败计数
					}
					
					if(failureCount>=3) {
						console.log('Too many apiGet, pausing for 0.5 hour...');
						await delay(1800000); // 暂停0.5小时
						failureCount=0; // 重置失败计数
					}

				}

 
			

			} else {
				console.log('Failed to load the page');
				failureCount++;
				if(failureCount>=3) {
					console.log('http status Code NoT 200 or 300, pausing for 0.5 hour...');
					await delay(1800000); // 暂停0.5小时
					failureCount=0; // 重置失败计数
				}
			}
			await browser.close();

			// }


		} catch(error) {
			console.log('Error loading the page:',error);
			failureCount++;
			if(failureCount>=3) {
				console.log('Too many failures, pausing for 0.5 hour...');
				await delay(1800000); // 暂停0.5小时
				failureCount=0;
			}
		} finally {
			await delay(1000); // 延时1秒
			console.log("延时1秒")
			console.log("失败或被限制累积次数:",failureCount)
		}


	}


	// 执行经销商模块

}



// 你可以通过遍历对象的属性来检查其中是否包含特定的字符串，例如“已达到每日请求限制”。以下是一个简单的方法示例，使用 JavaScript 来实现这一功能。
function containsDailyLimitReached(data) {
	// 检查输入是否是对象
	if(typeof data!=='object'||data===null) {
		return false; // 如果不是对象，返回 false
	}

	// 将对象转换为 JSON 字符串
	const jsonString=JSON.stringify(data);

	// 检查 JSON 字符串中是否包含指定的字符串
	return jsonString.includes("已达到每日请求限制");
}


// 删除已经处理过的链接
function removeProcessedLink(link,filePath) {
	const links=fs.readFileSync(filePath,'utf-8').split('\n').filter(line => line.trim());
	const updatedLinks=links.filter(l => l!==link);
	fs.writeFileSync(filePath,updatedLinks.join('\n'),'utf-8');
}

// 启动任务
// processLinks();
module.exports={ getEnfContact }; // 导出该函数


// 确保 processLinks 完成后再调用 startTask
async function run() {
	await getEnfContact2();     // 然后再调用另一个方法
	await getEnfContact1();  // 等待主方法完成

}


run();