# 定期运行仓库大小分析的配置指南

## 1. 任务计划程序配置

### 步骤 1：打开任务计划程序

1. 按 `Win + R` 键打开运行对话框
2. 输入 `taskschd.msc` 并按 Enter
3. 在任务计划程序窗口中，选择「创建基本任务」

### 步骤 2：创建基本任务

1. **名称**：输入「仓库大小分析」
2. **描述**：输入「定期分析Git仓库大小，识别大型文件」
3. **下一步**

### 步骤 3：设置触发器

1. **选择触发器**：根据需要选择
   - 每天
   - 每周（推荐）
   - 每月
2. **设置时间**：选择合适的时间，建议在非工作时间
3. **下一步**

### 步骤 4：设置操作

1. **选择操作**：启动程序
2. **下一步**
3. **程序/脚本**：浏览选择 `scripts\run_repo_analysis.bat`
4. **起始于**：设置为仓库根目录 `d:\xinet\spaces\tao`
5. **下一步**

### 步骤 5：完成设置

1. 检查设置信息
2. 勾选「当单击完成时，打开此任务的属性对话框」
3. **完成**

### 步骤 6：高级设置

在属性对话框中：

1. **常规**选项卡：
   - 勾选「不管用户是否登录都要运行」
   - 勾选「使用最高权限运行」

2. **条件**选项卡：
   - 取消勾选「只有在计算机使用交流电源时才启动此任务」

3. **设置**选项卡：
   - 勾选「如果任务运行时间超过以下时间，停止任务」：设置为 10 分钟
   - 勾选「如果此任务已经在运行，执行以下操作」：选择「并行运行新实例」

4. **确定**保存设置

## 2. 手动运行测试

### 测试批处理脚本

```bash
# 在仓库根目录运行
scripts\run_repo_analysis.bat
```

### 验证输出

1. 检查是否生成了分析报告文件（如 `repo_size_report_20260407_123456.json`）
2. 检查 `analysis_log.txt` 文件是否记录了运行时间
3. 查看分析报告内容是否完整

## 3. 分析报告说明

### 报告内容

- **仓库基本信息**：大小、对象数量
- **大型对象**：体积最大的20个对象
- **大型文件**：超过10MB的文件及其历史变更记录
- **分析结果**：文件数量、总大小等统计信息
- **建议**：基于分析结果的优化建议

### 报告存储

- 分析报告以 JSON 格式存储在仓库根目录
- 文件名格式：`repo_size_report_YYYYMMDD_HHMMSS.json`
- 运行日志存储在 `analysis_log.txt`

## 4. 自定义配置

### 调整分析频率

根据仓库活跃度调整任务计划的频率：
- **活跃仓库**：每周一次
- **一般仓库**：每月一次
- **不活跃仓库**：每季度一次

### 调整分析参数

修改 `scripts\repo_size_analyzer.py` 中的参数：

- **大型文件阈值**：`get_large_files(min_size=10*1024*1024)`
- **显示对象数量**：`get_large_objects(top_n=20)`

## 5. 故障排除

### 常见问题

1. **任务不运行**：
   - 检查任务计划程序的权限设置
   - 检查批处理脚本的路径是否正确
   - 检查 Python 是否在系统 PATH 中

2. **脚本运行出错**：
   - 检查 Git 命令是否可用
   - 检查仓库是否为有效的 Git 仓库
   - 查看脚本输出的错误信息

3. **报告文件过大**：
   - 考虑减少分析的对象数量
   - 定期清理旧的分析报告

## 6. 集成到 CI/CD

如果使用 CI/CD 系统，可以在构建过程中添加仓库大小分析步骤：

### GitHub Actions 示例

```yaml
name: Repo Size Analysis

on:
  schedule:
    - cron: '0 0 * * 0'  # 每周日运行
  workflow_dispatch:  # 手动触发

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.14'
      
      - name: Run repo size analysis
        run: python scripts/repo_size_analyzer.py
      
      - name: Upload report
        uses: actions/upload-artifact@v4
        with:
          name: repo-size-report
          path: repo_size_report_*.json
```

### GitLab CI 示例

```yaml
repo_size_analysis:
  script:
    - python scripts/repo_size_analyzer.py
  artifacts:
    paths:
      - repo_size_report_*.json
  schedule:
    - cron: '0 0 * * 0'
  only:
    - schedules
```

## 7. 结论

通过定期运行仓库大小分析，可以：

1. **及时发现**大型文件和仓库膨胀问题
2. **提前预警**仓库大小异常增长
3. **持续优化**仓库结构和配置
4. **建立基线**，跟踪仓库大小的变化趋势

建议将此任务纳入常规维护流程，确保仓库始终保持在合理的大小范围内。
