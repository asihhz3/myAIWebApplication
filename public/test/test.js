
var key = () => document.getElementById("in").value

function test1() {
   var myHeaders = new Headers();
   myHeaders.append("Authorization", key());
   myHeaders.append("Content-Type", "application/json");

   var raw = JSON.stringify({
      "model": "gpt-5",
      "messages": [
         {
            "role": "developer",
            "content": "You are a helpful assistant."
         },
         {
            "role": "user",
            "content": "Hello"
         }
      ],
      "stream": true
   });

   var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
   };
    fetch("https://api.cometapi.com/v1/chat/completions", requestOptions)
    .then(
            async (response) => {
               const reader = response.body.getReader()
               const utf8Decoder = new TextDecoder("utf-8")
               let buf = ""
               while(true) {
                  let { value, done } = await reader.read()
                  if (done) {
                     console.log("end:" + utf8Decoder.decode(value, { stream: false }))
                     break
                  }
                  if (!value) {
                     console.error("value is null")
                     break
                  }
                  utf8Decoder.decode(value, { stream: true }).split('\n').forEach(
                     line => {
                        let json = parseSSEData(line)
                        if (json == null || json.choices[0].finish_reason) {
                           return
                        }
                        buf = buf + json.choices[0].delta.content
                     }
                  )
               }
               console.log("content:" + buf)
            }
        )
    .catch(error => console.log('error', error));
}

function parseSSEData(line) {

  // 过滤空行和 [DONE] 标记
  if (!line.trim() || line.trim() === 'data: [DONE]') {
    return null;
  }
  
  // 移除 "data: " 前缀
  if (line.startsWith('data: ')) {
    const jsonStr = line.slice(6); // 移除 "data: "
    
    try {
      return JSON.parse(jsonStr);
    } catch (error) {
      console.warn('JSON解析失败:', jsonStr, error);
      return null;
    }
  }
  
  return null;
}



function test2() {
   const test2_header = new Headers()
   test2_header.append("Authorization", key())
   test2_header.append("Content-Type","application/json")
   test2_header.append("Connection", "keep-alive")

   var raw = JSON.stringify({
    "contents": [
         {
            "role": "user",
            "parts": [
               {
                  "text": "'Maintain the character features in the image to generate a new portrait photo: a woman leaning on a wooden railing of a traditional Chinese building. She is wearing a blue cheongsam with pink and red floral motifs and a headdress made of colorful flowers, including roses and lilacs. Her right hand gently touches a large kite with a blue background, decorated with pink fish motifs and a pair of large eyes. The background is the interior of an old wooden building, dimly lit and cozy. The painting style is realistic, focusing on the textural details of the clothing patterns, floral headdresses, and wooden buildings"
               }
            ]
         }
      ],
      "generationConfig": {
         "responseModalities": [
               "IMAGE"
         ],
         "imageConfig": {
               "aspectRatio": "9:16"
         }
      }
   });

   const test2_option = {
      method: 'POST',
      headers: test2_header,
      body: raw,
      redirect: 'follow'
   };
    fetch("https://api.cometapi.com/v1beta/models/gemini-2.5-flash-image:streamGenerateContent", test2_option)
    .then(
            async (response) => {
               console.log(response)
            }
        )
    .catch(error => console.log('error', error));
}

function test3() {
   base64_to_img(key(), "test_img")
}

function base64_to_img(dataurl, file_name = "test") {
    var arr = dataurl.split(',');
    var mime = arr[0].match(/:(.*?);/)[1];
    var suffix = mine.split("/")[1];
    var bstr = atob(arr[1]);
    var n = bstr.length;
    var u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], `${file_name}.${suffix}`, { type: mime });
}

