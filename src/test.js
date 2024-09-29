const fs=require('fs');
const puppeteer=require('puppeteer');
const delay=ms => new Promise(resolve => setTimeout(resolve,ms));

// 从文件中读取链接并逐行处理
async function processLinks() {
	const filePath='datain/所有经销商站点清单.txt'; // 文件路径
	const links=fs.readFileSync(filePath,'utf-8').split('\n').filter(link => link.trim());

	for(const link of links) {
		console.log("总共还有"+links.length+"个链接待处理！");
		console.log(`Loading link: ${link}`);
		const regex=/\.cn/;
		try {
			const browser=await puppeteer.launch({
				executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'  // 指定 Chrome 的安装路径
			});
			const page=await browser.newPage();
			const response=await page.goto(link,{ waitUntil: 'networkidle2' });
			const status=response.status();
			console.log(`HTTP Status Code: ${status}`);

			if(status>=200&&status<300) {
				console.log('Page loaded successfully');

				// 确保容器存在并提取数据
				const siteData=await page.evaluate(() => {
					const container=document.querySelector('.enf-company-profile-info-main-spec.position-relative');
					if(!container) return {};

					const address=container.querySelector('td[itemprop="address"]')?.textContent?.trim()||'无';
					const telephone=container.querySelector('td[itemprop="telephone"]')?.textContent?.trim()||'无';
					const emailElement=container.querySelector('td[itemprop="email"]');
					let email=emailElement? emailElement.textContent.trim():'无';

					// 去掉 "mailto:" 前缀
					const formattedEmail=email.startsWith('mailto:')? email.replace(/^mailto:/i,''):email;

					// 获取 URL
					const urlElement=container.querySelector('a[itemprop="url"]');
					const url=urlElement? urlElement.href:'无';

					return { address,telephone,formattedEmail,url };
				});

				console.log('Site data:',siteData);

				if(regex.test(siteData.url)||regex.test(siteData.formattedEmail)) {
					console.log("链接包含 .cn 字符,排除：",siteData.url,siteData.formattedEmail);
				} else {
					const formattedData=`address: ${siteData.address}\ntelephone: ${siteData.telephone}\nemail: ${siteData.formattedEmail}\nurl: ${siteData.url}\n\n`;
					fs.appendFileSync('data/获取的经销商联系信息.txt',formattedData);

					// 判断是否API超限了
					if(containsDailyLimitReached(siteData)) {
						console.log("api超限，保留该链接下次处理：",link);
					} else {
						removeProcessedLink(link,filePath);
					}
				}
				failureCount=0; // 重置失败计数
			} else {
				console.log('Failed to load the page');
				failureCount++;
				if(failureCount>=3) {
					console.log('Too many requests, pausing for 1 hour...');
					await delay(1800000); // 暂停1小时
					failureCount=0; // 重置失败计数
				}
			}
			await browser.close();
		} catch(error) {
			console.log('Error loading the page:',error);
			failureCount++;
			if(failureCount>=3) {
				console.log('Too many failures, pausing for 1 hour...');
				await delay(1800000); // 暂停1小时
				failureCount=0;
			}
		} finally {
			await delay(3000); // 延时3秒
			console.log("延时3秒");
		}
	}
}

processLinks()