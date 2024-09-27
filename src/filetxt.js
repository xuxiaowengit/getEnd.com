

const fs=require('fs-extra');
const path=require('path');




/**
 * 追加文本内容到指定文件
 * @param {string} filePath - 文件路径
 * @param {string} content - 需要追加的文本内容
 * @param {function} callback - 完成后的回调函数
 */
function appendToFile(filePath,content,callback) {
	
	const absolutePath=path.resolve(filePath);

	// 使用 fs-extra 的 appendFile 方法追加内容到文件
	fs.appendFile(absolutePath,content+'\n')
		.then(() => callback(null))
		.catch(err => callback(err));
	
	
}

// 导出模块
module.exports={
	appendToFile
};
