const fs=require('fs');
const path=require('path');

/**
 * 将数组保存为 JSON 文件
 * @param {Array} dataArray - 要保存的数组数据
 * @param {string} fileName - JSON 文件的名称
 * @param {string} [directory='.'] - 文件保存的目录，默认为当前目录
 */
const saveArrayToJson=(dataArray,fileName,directory='.') => {
	const filePath=path.join(directory,fileName);

	// 将数组转换为 JSON 字符串
	const jsonData=JSON.stringify(dataArray,null,2); // 格式化 JSON 数据

	// 写入文件
	fs.writeFile(filePath,jsonData,'utf8',(err) => {
		if(err) {
			console.error('Error writing JSON file:',err);
		} else {
			console.log('JSON file has been saved:',filePath);
		}
	});
};

module.exports={ saveArrayToJson };
