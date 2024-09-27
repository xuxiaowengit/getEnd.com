// 创建新表格

// const xlsx=require('xlsx');
// const path=require('path');

// function exportToExcel(data,filePath) {
// 	// 创建一个新的工作簿
// 	const workbook=xlsx.utils.book_new();

// 	// 将数组对象转换为工作表
// 	const worksheet=xlsx.utils.json_to_sheet(data);

// 	// 将工作表添加到工作簿中
// 	xlsx.utils.book_append_sheet(workbook,worksheet,'Sheet1');

// 	// 处理文件路径
// 	const fullPath=path.resolve(filePath);

// 	// 写入 Excel 文件
// 	xlsx.writeFile(workbook,fullPath);
// }

// module.exports=exportToExcel;


// 追加数据到表格
const xlsx=require('xlsx');
const path=require('path');
const fs=require('fs');

function exportToExcel(data,filePath) {
	// 处理文件路径
	const fullPath=path.resolve(filePath);

	let workbook;

	// 检查文件是否存在
	if(fs.existsSync(fullPath)) {
		try {
			// 如果文件存在，读取现有的 Excel 文件
			workbook=xlsx.readFile(fullPath);
		} catch(error) {
			console.error('读取现有 Excel 文件时出错:',error);
			// 发生错误时创建一个新的工作簿
			workbook=xlsx.utils.book_new();
		}
	} else {
		// 如果文件不存在，创建一个新的工作簿
		workbook=xlsx.utils.book_new();
	}

	// 将数组对象转换为工作表
	const newWorksheet=xlsx.utils.json_to_sheet(data);

	// 检查是否已经有名为 'Sheet1' 的工作表
	if(workbook.Sheets['Sheet1']) {
		// 如果有，获取现有工作表的数据范围
		const existingSheet=workbook.Sheets['Sheet1'];
		const existingData=xlsx.utils.sheet_to_json(existingSheet,{ header: 1 });

		// 将现有数据与新数据合并
		const combinedData=existingData.concat(xlsx.utils.sheet_to_json(newWorksheet,{ header: 1 }));

		// 将合并后的数据转换为新的工作表
		const combinedWorksheet=xlsx.utils.aoa_to_sheet(combinedData);

		// 用合并后的工作表替换现有工作表
		workbook.Sheets['Sheet1']=combinedWorksheet;
	} else {
		// 如果没有名为 'Sheet1' 的工作表，则添加新的工作表
		xlsx.utils.book_append_sheet(workbook,newWorksheet,'Sheet1');
	}

	// 写入 Excel 文件
	try {
		xlsx.writeFile(workbook,fullPath);
		console.log('数据已成功导出到 Excel 文件:',fullPath);
	} catch(error) {
		console.error('写入 Excel 文件时出错:',error);
	}
}

module.exports=exportToExcel;
