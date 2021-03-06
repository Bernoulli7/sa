
function setTrigger(){//GASのデプロイでトリガーの設定をしてください
  const time = new Date();
  time.setHours(15);
  time.setMinutes(00);
  ScriptApp.newTrigger('MakeTest').timeBased().at(time).create();
}

function MakeTest(){
  doGet()
}

function doGet(){//Webアプリケーションとして公開
  random();
  results=createForm();
  url=results[0];
  console.log(url)
  sendmail(url)
  slackbot(url)
  display=results[1]
  num=results[2]
  text=makehtml(disply,num)
  var t=HtmlService.createTemplateFromFile("test");
  t.msg=text;
  return t.evaluate();
}

const disply=[];//ここで、表示用の配列を定義
function createForm(){
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const values = ss.getSheetByName('英単語一覧').getDataRange().getValues();
  const formTitle = new Date()+"英単語テスト"; //タイトル
  Logger.log(formTitle)
  const formDescription = values[1][2]; //説明
  const num = values[2][2]; //問題数
  const choice = values[3][2]; //選択肢数
  const point = values[4][2]; //配点
  var array = [];//選択肢を一時保管する配列
  var tmp = [];//選択肢を一時保管する配列
  var question = [];//選択肢を作成する配列
  var choices = [];//最終的な選択肢を保管する配列
  const form = FormApp.create(formTitle);
  form.setDescription(formDescription);
  form.setShuffleQuestions(true);//問題をシャッフルする
  form.setShuffleQuestions(true);//選択肢の順序をシャッフルする
  form.setIsQuiz(true);//テストにする
  
  for(i=1; i<=num; i++){ //選択肢のセット
    array[i] = values[6+i][2]; //i問目の答えはarray[i]に格納されている
  }
  for(i=1; i<=num; i++){
    tmp[0] = values[5+i][2]; //正解をtmp[0]に格納
    var n = []; //選択肢に入れる問題番号
    n[1] = Math.floor(Math.random()*num)+1; //選択肢の問題番号1つ目にランダムで問題数以下の数字を格納
    //Logger.log(i+"問目")
    for(j=1; j<choice;){//j番目の選択肢をつくる
      if(i-1 === n[j]){ //「問題番号と選択肢番号が一致」ならば
        n[j] = Math.floor(Math.random()*num)+1; //番号を変更してやり直し
      }else{
        for(m=1; m<j; m++){
          if(n[j] === n[m]){ //「これまでの選択肢と一致」ならば
            n[j] = Math.floor(Math.random()*num)+1; //n[j]を変更
            break;
          }
        }
        if(m === j){
          tmp[j] = array[n[j]];  //選択肢に追加
          n[j+1] = Math.floor(Math.random()*num)+1;
          j += 1;//次の問題へ
        }
      }
    }
    var x = Math.floor(Math.random()*choice); //正解の選択肢の番号
    for(j=0; j<choice; j++){
      question[(x+j) % choice] = tmp[j]; //選択肢に格納
    }
    
    var item = form.addMultipleChoiceItem();
    item.setTitle(values[5+i][1]);
    disply.push("Q"+i+"  "+values[5+i][1])
    choices.length = 0; //要素をすべて削除
    for(j=0; j<choice; j++){
      //Logger.log(j+"."+tmp[j])
      disply.push(j+1+"."+question[j])
      if(j === x){
        choices.push(item.createChoice(question[j],true));
      }else{
        choices.push(item.createChoice(question[j],false));
      }
    }
    //Logger.log("正解は「"+tmp[0]+"」です。")
    disply.push(x+1+"."+tmp[0])
    disply.push("\n\n\n正解は「"+tmp[0]+"」です。")
    item.setChoices(choices);//選択肢を配列ごと設定
    // @ts-ignore
    item.setFeedbackForCorrect(FormApp.createFeedback().setText("正解は「"+tmp[0]+"」です。").build());//正解時のフィードバック
    item.setFeedbackForIncorrect(FormApp.createFeedback().setText("正解は「"+tmp[0]+"」です。").build());//不正解時のフィードバック
    item.setRequired(true);
    item.setPoints(point);
  }
  //Logger.log(form.getEditUrl())
  
  return [form.getPublishedUrl(),disply,num]
}

function makehtml(display,num){//Webアプリケーションとして公開
  //console.log(disply)
  let html=""
  let answer="";
  for(var j=0;j<num*7;j++){
    //console.log(display[j]);
    if(j%7==0){//問題
      html+="<h2>";
      html+="<font color=\"dimgray\">"
      html+=display[j];
      answer=display[j+5]
      html+="</font>"
      html+="</h2>";
    }else if(j%7==6){//正解は~です。
      ;
    }else if(j%7==5){//正解はするー
      ;
    }else{//正解はオレンジに
      html+="<p>";
      if(display[j]==answer){
        html+="<font color=\"orangered\">"
        html+=display[j];
        html+="</font>"
      }else{
        html+=display[j];
      }
      html+="</p>";
    }
  }
  return html;
}


function random() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  sheet.getRange(7, 1, lastRow, lastCol).sort(4);
}

function sortA() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  sheet.getRange(7, 1, lastRow, lastCol).sort(1);
}

function sendmail(url){
  /* 管理者宛メール送信設定 */
  var address = '[ここに送信するメールアドレスを入力してください]'; 
  var title = '英単語テスト'; 
  var usermail = '[ここに受信するメールアドレスを入力してください]';
  var content = "本日の英単語テスト30題です。\n\n"
  + url
  + "\n\n"
  + "解答はこちらです\n\n"
  +"[ここにデプロイIDを入力してください]"
  + '\n\n※このメールはGoogleフォームからの自動送信メールです。'; 
  var options = {from: address, bcc: '', name: 'English', replyTo: usermail};
  GmailApp.sendEmail(usermail, title, content, options);
}


function setTrigger(){//GASのデプロイでトリガーの設定をしてください
  const time = new Date();
  time.setHours(15);
  time.setMinutes(00);
  ScriptApp.newTrigger('MakeTest').timeBased().at(time).create();
}

function MakeTest(){
  doGet()
}

function doGet(){//Webアプリケーションとして公開
  random();
  results=createForm();
  url=results[0];
  console.log(url)
  sendmail(url)
  display=results[1]
  num=results[2]
  text=makehtml(disply,num)
  var t=HtmlService.createTemplateFromFile("test");
  t.msg=text;
  return t.evaluate();
}

const disply=[];//ここで、表示用の配列を定義
function createForm(){
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const values = ss.getSheetByName('英単語一覧').getDataRange().getValues();
  const formTitle = new Date()+"英単語テスト"; //タイトル
  Logger.log(formTitle)
  const formDescription = values[1][2]; //説明
  const num = values[2][2]; //問題数
  const choice = values[3][2]; //選択肢数
  const point = values[4][2]; //配点
  var array = [];//選択肢を一時保管する配列
  var tmp = [];//選択肢を一時保管する配列
  var question = [];//選択肢を作成する配列
  var choices = [];//最終的な選択肢を保管する配列
  const form = FormApp.create(formTitle);
  form.setDescription(formDescription);
  form.setShuffleQuestions(true);//問題をシャッフルする
  form.setShuffleQuestions(true);//選択肢の順序をシャッフルする
  form.setIsQuiz(true);//テストにする
  
  for(i=1; i<=num; i++){ //選択肢のセット
    array[i] = values[6+i][2]; //i問目の答えはarray[i]に格納されている
  }
  for(i=1; i<=num; i++){
    tmp[0] = values[5+i][2]; //正解をtmp[0]に格納
    var n = []; //選択肢に入れる問題番号
    n[1] = Math.floor(Math.random()*num)+1; //選択肢の問題番号1つ目にランダムで問題数以下の数字を格納
    //Logger.log(i+"問目")
    for(j=1; j<choice;){//j番目の選択肢をつくる
      if(i-1 === n[j]){ //「問題番号と選択肢番号が一致」ならば
        n[j] = Math.floor(Math.random()*num)+1; //番号を変更してやり直し
      }else{
        for(m=1; m<j; m++){
          if(n[j] === n[m]){ //「これまでの選択肢と一致」ならば
            n[j] = Math.floor(Math.random()*num)+1; //n[j]を変更
            break;
          }
        }
        if(m === j){
          tmp[j] = array[n[j]];  //選択肢に追加
          n[j+1] = Math.floor(Math.random()*num)+1;
          j += 1;//次の問題へ
        }
      }
    }
    var x = Math.floor(Math.random()*choice); //正解の選択肢の番号
    for(j=0; j<choice; j++){
      question[(x+j) % choice] = tmp[j]; //選択肢に格納
    }
    
    var item = form.addMultipleChoiceItem();
    item.setTitle(values[5+i][1]);
    disply.push("Q"+i+"  "+values[5+i][1])
    choices.length = 0; //要素をすべて削除
    for(j=0; j<choice; j++){
      //Logger.log(j+"."+tmp[j])
      disply.push(j+1+"."+question[j])
      if(j === x){
        choices.push(item.createChoice(question[j],true));
      }else{
        choices.push(item.createChoice(question[j],false));
      }
    }
    //Logger.log("正解は「"+tmp[0]+"」です。")
    disply.push(x+1+"."+tmp[0])
    disply.push("\n\n\n正解は「"+tmp[0]+"」です。")
    item.setChoices(choices);//選択肢を配列ごと設定
    // @ts-ignore
    item.setFeedbackForCorrect(FormApp.createFeedback().setText("正解は「"+tmp[0]+"」です。").build());//正解時のフィードバック
    item.setFeedbackForIncorrect(FormApp.createFeedback().setText("正解は「"+tmp[0]+"」です。").build());//不正解時のフィードバック
    item.setRequired(true);
    item.setPoints(point);
  }
  //Logger.log(form.getEditUrl())
  
  return [form.getPublishedUrl(),disply,num]
}

function makehtml(display,num){//Webアプリケーションとして公開
  //console.log(disply)
  let html=""
  let answer="";
  for(var j=0;j<num*7;j++){
    //console.log(display[j]);
    if(j%7==0){//問題
      html+="<h2>";
      html+="<font color=\"dimgray\">"
      html+=display[j];
      answer=display[j+5]
      html+="</font>"
      html+="</h2>";
    }else if(j%7==6){//正解は~です。
      ;
    }else if(j%7==5){//正解はするー
      ;
    }else{//正解はオレンジに
      html+="<p>";
      if(display[j]==answer){
        html+="<font color=\"orangered\">"
        html+=display[j];
        html+="</font>"
      }else{
        html+=display[j];
      }
      html+="</p>";
    }
  }
  return html;
}


function random() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  sheet.getRange(7, 1, lastRow, lastCol).sort(4);
}

function sortA() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  sheet.getRange(7, 1, lastRow, lastCol).sort(1);
}

function sendmail(url){
  /* 管理者宛メール送信設定 */
  var address = '[ここに送信するメールアドレスを入力してください]'; 
  var title = '英単語テスト'; 
  var usermail = '[ここに受信するメールアドレスを入力してください]';
  var content = "本日の英単語テスト30題です。\n\n"
  + url
  + "\n\n"
  + "解答はこちらです\n\n"
  +"[ここにデプロイIDを入力してください]"
  + '\n\n※このメールはGoogleフォームからの自動送信メールです。'; 
  var options = {from: address, bcc: '', name: 'English', replyTo: usermail};
  GmailApp.sendEmail(usermail, title, content, options);
}


var CHANNEL_ACCESS_TOKEN="[ここにslackのワークスペースのトークンを入力してください]";// Channel_access_tokenを登録
function slackbot(url){
  var post_url = "https://hooks.slack.com/services/"+"[ここにWebhook URLs for Your Workspaceでチャンネルのurlの情報を入力してください]"; //postメソッドのurl//@slack API, Activate Incoming Webhooks
  var jsondata = {
        "text":"本日の英単語テスト30題です。\n\n"
        + url
        + "\n\n"
        + "解答はこちらです\n\n"
        +"https://script.google.com/macros/s/AKfycbwEiECzxaBaBpmDE_8mKtN9G1T3suyEZzqk4aBqVxKFtTzGxHejyv-h3YzIsQ2nUeWCVg/exec"
      }
      
  var payload = JSON.stringify(jsondata);
  var options = {
      "method": "post",
      "contentType": "application/json",
      "payload":payload,
  };
  
  UrlFetchApp.fetch(post_url, options);

}

