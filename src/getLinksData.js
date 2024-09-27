const fs=require('fs');
const puppeteer=require('puppeteer');

// 记录连续失败次数
let failureCount=0;

// 延迟函数
const delay=ms => new Promise(resolve => setTimeout(resolve,ms));

// 从文件中读取链接并逐行处理
async function processLinks() {
	const filePath='datain/所有安装商站点清单.txt'; // 文件路径
	const links=fs.readFileSync(filePath,'utf-8').split('\n').filter(link => link.trim());  //要在本身目录启动程序	

	for(const link of links) {
		console.log(`Loading link: ${link}`);
		const url=link;
		const regex=/\.cn/;
		try {
		
			if(regex.test(url)) {
				console.log("链接包含 .cn 字符,跳过：",link);
				// 删除该链接
				removeProcessedLink(link,filePath);
			} else {
				// const browser=await puppeteer.launch();
				const browser=await puppeteer.launch({
					executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'  // 指定 Chrome 的安装路径
				});
				const page=await browser.newPage();

				const response=await page.goto(link,{ waitUntil: 'networkidle2' });

				const status=response.status();
				console.log(`HTTP Status Code: ${status}`);

				if(status>=200&&status<300) {
					console.log('Page loaded successfully');

					// 确保容器内的所有 onclick 元素点击成功
					await page.evaluate(async () => {
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
					await delay(1000); // 暂停1小时

					// 获取页面数据
					const siteData=await page.evaluate(() => {
						const container=document.querySelector('.enf-company-profile-info-main-spec.position-relative');
						if(!container) return {};

						const address=container.querySelector('td[itemprop="address"]')?.textContent?.trim()||'无';
						const telephone=container.querySelector('td[itemprop="telephone"]')?.textContent?.trim()||'无';
						// const email=container.querySelector('td[itemprop="email"]')?.textContent?.replace(/^mailto:/i,'')||'无';
						const emailElement=container.querySelector('td[itemprop="email"]');
						const email=emailElement? emailElement.textContent.trim():'无';
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

						// return { address,telephone,email };
					});

					console.log('Site data:',siteData);

					// 格式化数据并保存到文件
					const formattedData=`address: ${siteData.address}\ntelephone: ${siteData.telephone}\nemail: ${siteData.email}\ntelephone: ${siteData.url}\ntelephone: ${siteData.additionalInfo}\n\n`;

					// 将格式化后的数据保存到文件
					fs.appendFileSync('data/连续获取安装商信息.txt',formattedData);


					// 成功后删除该链接
					removeProcessedLink(link,filePath);

					failureCount=0; // 重置失败计数

				} else {
					console.log('Failed to load the page');
					failureCount++;
					if(failureCount>=3) {
						console.log('Too many Get, pausing for 1 hour...');
						await delay(1800000); // 暂停0.5小时
						failureCount=0; // 重置失败计数
					}
				}
				await browser.close();

			}

			
		} catch(error) {
			console.log('Error loading the page:',error);
			failureCount++;
			if(failureCount>=3) {
				console.log('Too many failures, pausing for 1 hour...');
				await delay(1800000); // 暂停0.5小时
				failureCount=0;
			}
		} finally {
			await delay(1000); // 暂停1小时
			console.log("延时1秒")
		}
	}
}

// 删除已经处理过的链接
function removeProcessedLink(link,filePath) {
	const links=fs.readFileSync(filePath,'utf-8').split('\n').filter(line => line.trim());
	const updatedLinks=links.filter(l => l!==link);
	fs.writeFileSync(filePath,updatedLinks.join('\n'),'utf-8');
}

// 启动任务
processLinks();
