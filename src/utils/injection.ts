// 创建一个注入服务
// services/injection.ts
export class InjectionService {
  evalInInspectedWindow(
    code: string,
    params?: Record<string, string>,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let codeString = code.toString();

      // 替换参数
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          codeString = codeString.replace(key, value);
        });
      }

      // 在检查页面中执行代码
      chrome.devtools.inspectedWindow.eval(
        `(${codeString})(chrome)`,
        (result, isException) => {
          if (isException) {
            reject(isException);
          } else {
            resolve(result);
          }
        },
      );
    });
  }
}
