
// helpers

function post_request(address, params, onstatechg)
{
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function()
    {
        if (httpRequest.readyState == 4)
            onstatechg(httpRequest.status, httpRequest.responseText);
    }
    httpRequest.open('POST', app_root+address, true);
    httpRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    httpRequest.send(params);

}

function escapehtml(str)
{
    var spec = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'};
    return str.replace(/[&<>"']/g, function(c) { return spec[c]; });
}

function get_cookie(name)
{
    return decodeURIComponent(('; '+document.cookie).split('; '+name+'=').pop().split(';')[0]);
}

function set_cookie(name, value)
{
    if (value === undefined || value === '')
    {
        document.cookie = name +'=; Path='+app_root+'; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
    else
    {
        var exdate = new Date();
        exdate.setDate(exdate.getDate() + 399);
        var c_value = encodeURIComponent(value) + '; Path='+app_root+'; Expires=' + exdate.toUTCString();
        document.cookie = name + "=" + c_value;
    }
}

function isInteger(value) { return /^\d+$/.test(value); }

function insertAtCaret(areaId, text)
{
    var txtarea = document.getElementById(areaId);
    var scrollPos = txtarea.scrollTop;
    var strPos = 0;
    var br = ((txtarea.selectionStart || txtarea.selectionStart == '0') ? "ff" : (document.selection ? "ie" : false ) );
    if (br == "ie")
    {
        txtarea.focus();
        var range = document.selection.createRange();
        range.moveStart ('character', -txtarea.value.length);
        strPos = range.text.length;
    }
    else if (br == "ff")
        strPos = txtarea.selectionStart;

    var front = (txtarea.value).substring(0,strPos);
    var back = (txtarea.value).substring(strPos,txtarea.value.length);
    txtarea.value=front+text+back;
    strPos = strPos + text.length;
    if (br == "ie")
    {
        txtarea.focus();
        var range = document.selection.createRange();
        range.moveStart ('character', -txtarea.value.length);
        range.moveStart ('character', strPos);
        range.moveEnd ('character', 0);
        range.select();
    }
    else if (br == "ff")
    {
        txtarea.selectionStart = strPos;
        txtarea.selectionEnd = strPos;
        txtarea.focus();
    }
    txtarea.scrollTop = scrollPos;
} 

function toggleTextAreaMarkers(areaId, before, after)
{
    var txtarea = document.getElementById(areaId);
    var scrollPos = txtarea.scrollTop;
    var str = txtarea.value;
    var strPos = txtarea.selectionStart;
    var strEnd = txtarea.selectionEnd;
    var front = str.substring(0, strPos);
    var mid = str.substring(strPos, strEnd);
    var back = str.substring(strEnd);

    if (front.endsWith(before) && back.startsWith(after))
    {
        front = front.substring(0, front.length - before.length);
        back = back.substring(after.length);
    }
    else
    {
        front += before;
        back = after + back;
    }

    txtarea.value = front + mid + back;
    txtarea.selectionStart = front.length;
    txtarea.selectionEnd = front.length + mid.length;
    txtarea.focus();
    txtarea.scrollTop = scrollPos;
}

function panel_link(event, element)
{
    if (event == null || event.target == null || (event.target.tagName != 'a' && event.target.tagName != 'A'))
    {
        var el = element.firstElementChild;
        if (el.tagName == 'a' || el.tagName == 'A')
            window.location = el.href;
        else
        {
            if (el.tagName == 'img' || el.tagName == 'IMG')
                el = el.nextSibling;
            window.location = el.firstElementChild.href;
        }
    }
}

// forum

function forum_changefilter(forumname, filter)
{
    var ffilter = document.getElementById('forumfilter');
    ffilter.disabled = true;
    post_request('forum_ajax.php', 'action=setfilter&fname='+forumname+'&filter='+filter, function(status, response)
    {
        if (status == 200)
        {
            ffilter.disabled = false;
            try { var resp = JSON.parse(response); }
            catch (err) { alert (response); return; }
            var threads = document.getElementById('forumtopics');
            threads.innerHTML = resp.threads;
            ffilter.innerHTML = resp.filter;
            window.history.replaceState(null, document.title, resp.url);
        }
    });
    return false;
}

var forumbackup = '';

function forum_cancelform()
{
    if (forumbackup != '')
    {
        document.getElementById('postform').innerHTML = forumbackup;
        forumbackup = '';
    }
}

function get_forum_tags(tagprefix, active)
{
    var code = '';
    if (forumtags.length > 0)
    {
        code = '<div class="picpick">Tags: ';
        for (var i = 0; i < forumtags.length; ++i)
        {
            var tag = forumtags[i];
            code += '<input type="checkbox" id="'+tagprefix+i+'"';
            if (active&tag[0])
                code += ' checked="checked"';
            if (tag[2] != 0)
                code += ' onclick="tagradio('+(tag[2]&~tag[0])+')"';
            code += ' value="'+tag[0]+'"><label title="'+tag[4]+'" for="tag-'+i+'"><img src="'+app_root+tag[3]+'"><span>'+tag[1]+'</span></label>';
        }
        code += '</div>';
    }
    return code;
}

function forum_showform(forumid, subtype)
{
    if (forumbackup != '') return; // probably double-click
    var item = document.getElementById('postform');

    var tagscode = get_forum_tags('tag-', 0);

    var subjtype = subtype >= 2 ? (subtype == 2 ? 'poll' : 'contest') : (subtype == 1 ? 'question' : 'discussion');
    var extracode = '';
    var extrapar = "''";
    if (subtype == 2)
    {
        extracode = '<div><input id="poll0" type="text" placeholder="<poll option 1>"><input id="poll1" type="text" placeholder="<poll option 2>"><input id="poll2" type="text" placeholder="<poll option 3>"><input id="poll3" type="text" placeholder="<poll option 4>"></div>';
        extrapar = "'poll'";
    }
    else if (subtype == 3)
    {
        var date = new Date()
        var date1 = date.toISOString().substring(0, 10);
        date.setTime(date.getTime() + 1000*60*60*24*7);
        var date2 = date.toISOString().substring(0, 10);
        date.setTime(date.getTime() + 1000*60*60*24*7);
        var date3 = date.toISOString().substring(0, 10);
        extracode = '<div>Start: <input id="contbeg" type="date" title="Contest start" value="'+date1+'"> Deadline: <input id="contmid" type="date" title="Contest submission deadline" value="'+date2+'"> Conclusion: <input id="contend" type="date" title="Contest end" value="'+date3+'"> Prize pool: <input id="contprize" type="number" placeholder="<buttons>" value="10"></div>';
        extrapar = "'cont'";
    }
    var subjcode = '<input id="topicsubject" type="text" placeholder="<'+subjtype+' subject>" title="A descriptive topic name; do not use generic phrases like \'help!\'.">';
    var areacode = '<textarea id="topicbody" rows="10" placeholder="<add more details here>"></textarea>';

    var controlscode = '<div class="postctrl"><span class="postbtn" id="postingstatus" onclick="forum_createtopic('+forumid+', '+subtype+', \'topicsubject\', \'tag-\', \'topicbody\', \'postingstatus\', '+extrapar+')">Publish</span>'+post_getcontrols('topicbody', 'attcont')+'</div>';

    forumbackup = item.innerHTML;
    item.innerHTML = '<br><div class="fullpanel"><div class="controls"><span class="delete" onclick="forum_cancelform()">Cancel</span></div><h2><img src="'+app_root+'i/'+subjtype+'.svg">Create new '+subjtype+'</h2></div>'+subjcode+tagscode+extracode+areacode+controlscode+'<br><br>';
    document.getElementById('topicsubject').focus();
}

function attachment_insert(areaid, id, mime) { insertAtCaret(areaid, '[[image:'+id+']]'); }

function get_poll_options(extra)
{
    var op1 = document.getElementById(extra+'0').value.replace(/^\s+|\s+$/g, '');
    var op2 = document.getElementById(extra+'1').value.replace(/^\s+|\s+$/g, '');
    var tmp = document.getElementById(extra+'2');
    var op3 = tmp != null ? tmp.value.replace(/^\s+|\s+$/g, '') : '';
        tmp = document.getElementById(extra+'3')
    var op4 = tmp != null ? tmp.value.replace(/^\s+|\s+$/g, '') : '';
    if (op1.includes('|') || op2.includes('|') || op3.includes('|') || op4.includes('|'))
    {
        alert('Poll options cannot contain the | character.')
        return null;
    }
    if (op1 == '' || op2 == '')
    {
        alert('You need to fill in at least 2 poll options.')
        return null;
    }
    if (op1 == op2 || op1 == op3 || op1 == op4 || op2 == op3 || op2 == op4 || (op3 != '' && op3 == op4))
    {
        alert('Poll options must be different.')
        return null;
    }
    polloptions = op1+'|'+op2;
    if (op3 != '') polloptions += '|'+op3;
    if (op4 != '') polloptions += '|'+op4;
    if (polloptions.length > 240)
    {
        alert('Poll options are too long, please make sure each option has fewer than 60 characters.')
        return null;
    }
    return polloptions;
}

function get_contest_options(extra)
{
    var cstr = document.getElementById(extra+'beg').value;
    var cmid = document.getElementById(extra+'mid').value;
    var cend = document.getElementById(extra+'end').value;
    var cprize = document.getElementById(extra+'prize').value.replace(/^\s+|\s+$/g, '');
    if (cprize < 10)
    {
        alert('Contest prize must be at least 10 buttons.')
        return null;
    }
    var dnow = new Date();
    var dstr = new Date(cstr);
    var dmid = new Date(cmid);
    var dend = new Date(cend);
    if (dstr >= dmid || dmid >= dend)
    {
        alert('Contest start must precede contest deadline and contest end.')
        return null;
    }
    if (dnow >= dmid)
    {
        alert('Contest deadline must not be already in the past.')
        return null;
    }
    return cstr+'|'+cmid+'|'+cend+'|'+cprize;
}

function forum_createtopic(forumid, subtype, subjectid, tagprefix, bodyid, statusid, extra)
{
    var subject = document.getElementById(subjectid).value.replace(/^\s+|\s+$/g, '');
    var message = document.getElementById(bodyid).value.replace(/\s+$/, '');

    if (subject.length < 2)
    {
        alert('Please give your post a proper name.');
        document.getElementById(subjectid).focus();
        return;
    }
    if (message.length < 5)
    {
        alert('Please describe your question, request or discussion topic in more details.');
        document.getElementById(bodyid).focus();
        return;
    }

    var polloptions = '';
    if (subtype == 2)
    {
        // poll
        polloptions = get_poll_options(extra);
        if (polloptions == null)
            return;
        polloptions = '&polloptions='+encodeURIComponent(polloptions);
    }
    var contestoptions = '';
    if (subtype == 3)
    {
        // contest
        contestoptions = get_contest_options(extra);
        if (contestoptions == null)
            return;
        contestoptions = '&contestoptions='+encodeURIComponent(contestoptions);
    }

    var i = 0;
    var tags = 0;
    while (true)
    {
        var el = document.getElementById(tagprefix+i);
        if (el == null) break;
        if (el.checked)
            tags |= el.value;
        ++i;
    }

    var oldmsg = document.getElementById(statusid).innerHTML;
    document.getElementById(statusid).innerHTML = 'Working...';

    post_request('forum_ajax.php',
        'action=createtopic&forumid='+forumid+'&subtype='+subtype+
        "&subject="+encodeURIComponent(subject)+
        "&tags="+tags+polloptions+contestoptions+
        "&message="+encodeURIComponent(message)+
        "&checkcode="+checkcode, function(status, response)
        {
            if (status == 200)
            {
                if (response != '' && /^(0|[1-9]\d*)$/.test(response))
                {
                    window.location.pathname = app_root+'forum/'+response;
                }
                else
                {
                    document.getElementById(statusid).innerHTML = oldmsg;
                    alert(response != '' ? response : 'An error occured, please make sure you have filled subject and topic body and try again.');
                }
            }
        });
}

// comments

function comment_hideform()
{
    var rtng = document.getElementById('postrtng');
	if (rtng) rtng.innerHTML = '';
    document.getElementById('postctrl').innerHTML = '';
    document.getElementById('postarea').value = '';
    document.getElementById('postarea').style.height = '';
    var att = document.getElementById('attcont');
    if (att)
        att.innerHTML = '';
}

var smilies = ['😉', '😊', '😁', '😞', '😮', '😎', '😴', '😠'];

function post_getcontrols(areaid, attel, atttp, attid)
{
    v = '<span onclick="toggleTextAreaMarkers(\''+areaid+'\', \'\\\'\\\'\\\'\', \'\\\'\\\'\\\'\')" style="font-weight:bold;" title="Bold">b</span>'+
        '<span onclick="toggleTextAreaMarkers(\''+areaid+'\', \'\\\'\\\'\', \'\\\'\\\'\')" style="font-style:italic;" title="Italic">i</span>'+
        '<span onclick="toggleTextAreaMarkers(\''+areaid+'\', \'[[\', \']]\')" style="font-style:italic;" title="Internal link">🔗</span>'+
        '<span onclick="toggleTextAreaMarkers(\''+areaid+'\', \'= \', \' =\')" title="Heading">H</span>'+
        '&nbsp;';
    for (i = 0; i < smilies.length; ++i)
        v += '<span onclick="insertAtCaret(\''+areaid+'\', \''+smilies[i]+'\')">'+smilies[i]+'</span>';
    if (typeof quickcodes == "object")
        for (i = 0; i < quickcodes.length; i += 2)
            v += '<img src="'+app_root+quickcodes[i]+'" onclick="insertAtCaret(\''+areaid+'\', \''+quickcodes[i+1]+'\')">';
    if (attel != null && myuid != 0)
        v += '&nbsp;<img src="'+app_root+'i/paperclip.svg" onclick="post_showattachments(\''+areaid+'\', \''+attel+'\', \''+atttp+'\', \''+attid+'\')" alt="paper clip icon" title="Attach">';
    return v+' &nbsp; <a style="display:inline-block;vertical-align:top;line-height:24px;" href="'+app_root+'text-formatting" rel="nofollow" target="_blank">More about formatting.</a>';
}

function post_getreviewpanel(currating, id)
{
    var selectoptions = ['&lt;not set&gt;', '0.5 stars - worst', '1 star', '1.5 stars', '2 stars', '2.5 stars', '3 stars', '3.5 stars', '4 stars', '4.5 stars', '5 stars - best'];
    var selectcode = '';
    for (var i = -1; i < 10; ++i)
        selectcode += '<option value="'+(i+1)+'"'+(i == currating ? ' selected="selected"' : '')+'>'+selectoptions[i+1]+'</option>';
    return 'Your rating: <select id="poststar'+id+'">'+selectcode+'</select>';
}

function post_getcontestpanel(defsel)
{
    var selectcode = '';
    var map = {'&': '&amp;','<': '&lt;','>': '&gt;','"': '&quot;',"'": '&#039;'};
    for (var i = 0; i < contcand.length; ++i)
        selectcode += '<option value="'+(contcand[i].itp+':'+contcand[i].iid)+'"'+(defsel === undefined ? i == 0 : (defsel == contcand[i].itp+':'+contcand[i].iid) ? ' selected="selected"' : '')+'>'+contcand[i].name.replace(/[&<>"']/g, function(m) { return map[m]; })+(contcand[i].itp == 'cs' ? ' Cursors' : ' Icons')+'</option>';
    return 'Your contest entry: <select id="contestentry">'+selectcode+'</select>';
}

function comment_showform(otp, oid, options, currating)
{
    var contest = typeof contcand == 'object';
    var rtng = document.getElementById('postrtng');
    var ctrl = document.getElementById('postctrl');
    var area = document.getElementById('postarea');
    if (ctrl.innerHTML == '')
    {
        //var v = '<input id="postno" class="postbtn" type="button" value="Cancel" onclick="comment_hideform()"><input id="postyes" class="postbtn" type="button" value="Publish" onclick="comment_create(\''+otp+'\', '+oid+', \''+options+'\')">';
        var v = '<span id="postyes" class="postbtn" onclick="comment_create(\''+otp+'\', '+oid+', \''+options+'\')">Publish</span><span id="postno" class="delete" onclick="comment_hideform()" title="Cancel" style="height:1em;"></span>';
        var v = '<span tabindex="0" id="postyes" class="postbtn" onclick="comment_create(\''+otp+'\', '+oid+', \''+options+'\')">Publish</span>';
        ctrl.innerHTML = v+post_getcontrols('postarea', 'attcont');
        area.style.height = '180px';
		if (rtng)
			rtng.innerHTML = contest ? post_getcontestpanel() : post_getreviewpanel(currating, '');
        //area.scrollIntoView({behavior:"smooth",block:"nearest",inline:"nearest"});
        document.getElementById('newpost').scrollIntoView({behavior:"smooth",block:"nearest",inline:"nearest"});
    }
}

function comment_create(otp, oid, options)
{
    var btnyes = document.getElementById('postyes');
    var rtng = document.getElementById('poststar');
    var cnts = document.getElementById('contestentry');
    var area = document.getElementById('postarea');
    var msg = area.value.replace(/^\s+|\s+$/g,"");
    if (msg == '')
    {
        comment_hideform('');
        return false;
    }
    var user = document.getElementById('postuser');
    if (user != null)
    {
        var username = user.value.replace(/^\s+|\s+$/g,"");
        if (username == '')
        {
            alert('Please choose your nickname.');
            user.focus();
            return false;
        }
    }
    //var btnno = document.getElementById('postno');
    btnyes.style = "pointer-events:none;";
    var prevtext = btnyes.innerHTML;
    btnyes.innerHTML = 'Working';
    btnyes.disabled = true;
    //btnno.disabled = true;
    area.disabled = true;
    if (rtng) rtng.disabled = true;
    if (cnts) cnts.disabled = true;
    post_request('comments_ajax.php', 'action=newcomment'+(rtng ? '&rating='+rtng.value : '')+(cnts ? '&contest='+cnts.value : '')+'&message='+encodeURIComponent(msg)+'&otp='+otp+'&oid='+oid+'&options='+options+'&checkcode='+checkcode, function(status, response)
    {
        if (status == 200 && response != '')
        {
            if (myuid == 0 && isInteger(response))
                window.location.reload(true);
            else if (response != 'ignore')
                document.getElementById('posts').innerHTML = response;
        }
        else
        {
            btnyes.innerHTML = prevtext;
            btnyes.style = '';
            //btnno.disabled = false;
            area.disabled = false;
            if (rtng) rtng.disabled = false;
            if (cnts) cnts.disabled = false;
            alert('Failed to publish your post. Please make sure your comment follows the guidelines and try again.');
        }
    });
}

function comment_delete(commid)
{
    post_request('comments_ajax.php', 'action=delete&postid='+commid, function(status, response)
    {
        if (status == 200)
        {
            if (response == 'OK')
            {
                var item = document.getElementById('post'+commid);
                if (item != null)
                    item.parentNode.removeChild(item);
            }
            else
                alert(response);
        }
    });
    return false;
}

var saved_posts = new Array();

function comment_modify_cancel(commid)
{
    var div = document.getElementById('content'+commid);
    var saved = saved_posts[commid];
    if (saved != null)
    {
        div.className = saved[0];
        div.innerHTML = saved[1];
        saved_posts[commid] = null;
    }
}

function comment_modify_apply(commid)
{
    var area = document.getElementById('postarea'+commid);
    if (area == null)
        return false;
    var msg = area.value.replace(/^\s+|\s+$/g,"");
    if (msg == '')
    {
        comment_modify_cancel(commid);
        return false;
    }
    var btnyes = document.getElementById('postyes'+commid);
    var btnno = document.getElementById('postno'+commid);
    var prevtext = btnyes.value;
    btnyes.value = 'Working';
    btnyes.disabled = true;
    btnno.disabled = true;
    area.disabled = true;
    var rtng = document.getElementById('poststar'+commid);
    if (rtng) rtng.disabled = true;
    var cnts = document.getElementById('contestentry');
    if (cnts) cnts.disabled = true;
    post_request('comments_ajax.php', 'action=modifycomment&postid='+commid+"&checkcode="+checkcode+"&message="+encodeURIComponent(msg)+(rtng ? '&rating='+rtng.value : '')+(cnts ? '&contest='+cnts.value : ''), function(status, response)
    {
        if (status == 200 && response != '')
        {
            area.disabled = false;
            var frag = document.createElement('div');
            frag.innerHTML = response;
            var orig = document.getElementById('post'+commid);
            var parent = orig.parentNode;
            var before = orig.nextSibling;
            parent.removeChild(orig);
            parent.insertBefore(frag.firstChild, before);
            saved_posts[commid] = null;
        }
        else
        {
            btnyes.value = prevtext;
            btnyes.disabled = false;
            btnno.disabled = false;
            area.disabled = false;
            if (rtng) rtng.disabled = false;
            if (cnts) cnts.disabled = false;
            alert('Failed to update the post. Please make sure your comment follows the guidelines and try again.');
        }
    });
}

function comment_modify(commid, rating)
{
    if (saved_posts[commid] != null)
        comment_modify_cancel(commid);
    post_request('comments_ajax.php', 'action=getcomment&postid='+commid, function(status, response)
    {
        if (status == 200)
        {
            var div = document.getElementById('content'+commid);
            var rat = document.getElementById('rating'+commid);
            var cnt = document.getElementById('centry'+commid);
            saved_posts[commid] = new Array(div.className, div.innerHTML, rat != null);
            var height = Math.round(response.length/50)*30;
            if (height < 60) height = 60; else if (height > 240) height = 240;
            div.innerHTML =
                (rating !== undefined ? '<div class="postrtng">'+post_getreviewpanel(rating, commid)+'</div>' : '')+
                (cnt !== null ? '<div class="postrtng">'+post_getcontestpanel(cnt.dataset.setid)+'</div>' : '')+
                '<textarea id="postarea'+commid+'" rows="10" cols="50" style="height:'+height+'px">'+response+'<\/textarea><div class="postctrl" id="postctrl'+commid+'">'+post_getcontrols('postarea'+commid, 'postatt'+commid, 'cm', commid)+'<span tabindex="0" id="postyes'+commid+'" class="postbtn" onclick="comment_modify_apply('+commid+')">Publish</span><span id="postno'+commid+'" class="postbtn" onclick="comment_modify_cancel('+commid+')">Cancel</span></div><div id="postatt'+commid+'"></div>';
            document.getElementById('postarea'+commid).focus();
        }
    });
    return false;
}

function comments_load(otp, oid, options, rating)
{
    var link = document.getElementById('loadposts');
    var prev = link.innerHTML;
    link.style.pointerEvents = 'none';
    link.innerHTML = 'Working...';
    post_request('comments_ajax.php', 'action=getallposts&otp='+otp+'&oid='+oid+'&options='+options+(rating !== undefined ? '&rating='+rating : ''), function(status, response)
    {
        if (status == 200 && response != '')
        {
            var item = document.getElementById('posts');
            item.innerHTML = response;
        }
        else
        {
            link.style.removeProperty('pointerEvents');
            link.innerHTML = prev;
        }
    });
    return false;
}

// alerts

function alerts_update(elem, state)
{
    if (elem === undefined) return;
    if (state)
    {
        elem.className = 'subscribed';
        elem.innerHTML = 'Subscribed';
    }
    else
    {
        elem.className = 'subscribe';
        elem.innerHTML = 'Subscribe';
    }
}

// profile

function account_command(action)
{
    post_request('user-ajax.php', 'action=acc'+action, function(status, response)
    {
        if (status == 200)
        {
            if (response == 'reload')
                window.location.reload();
            else if (response.startsWith('redirect:'))
                window.location.href = response.substring(9);
            else
                alert(response);
        }
    });
}

function account_logout()
{
    //set_cookie('cookieuid', uid);
    set_cookie('name');
    set_cookie('nick');
    set_cookie('intro');
    set_cookie('gender');
    set_cookie('web');
    set_cookie('cookietoken');
    set_cookie('cookiepass');
    set_cookie('cookieemail');
    set_cookie('alerts');
    set_cookie('gender');
    for (var i = 0; i < 10; ++i)
        set_cookie('cnt'+i);
    window.location.reload(true);
}

function profile_feedback(btn, fieldid)
{
    return function(result)
    {
        var fdbk = document.getElementById(fieldid);
        fdbk.innerHTML = result == 'OK' ? 'Your <a href="'+app_root+'user/'+myuid+'">profile</a> was updated.' : 'Something went wrong, please try again later.';
        btn.disabled = false;
    }
}

function profile_about(nick, intro, genmale, genfemale, donate)
{
    var nickval = nick.value.replace(/^\s+|\s+$/g,"");
    if (nickval == '')
    {
        alert('Your nick must not be empty.')
        nick.focus();
        return;
    }
    var introval = intro.value.replace(/^\s+|\s+$/g,"");
    var gender = '';
    if (genmale.checked) gender = 'male';
    else if (genfemale.checked) gender = 'female';
    donateval = null;
    if (donate)
        donateval = donate.value.replace(/^\s+|\s+$/g,"");

    profile_about_exec(nickval, introval, gender, donateval, profile_feedback('accfdbk'));
}

function profile_contacts(btn, name, web, linetempl)
{
    var nameval = document.getElementById(name).value.replace(/^\s+|\s+$/g,"");
    var webval = document.getElementById(web).value.replace(/^\s+|\s+$/g,"");
    var extra = {};
    for (var i = 0; (line = document.getElementById(linetempl+i)) != null; ++i)
    {
        var select = line.getElementsByTagName('select')[0];
        var input = line.getElementsByTagName('input')[0];
        if (select.value == 'none')
            continue;
        var cntval = input.value.replace(/^\s+|\s+$/g,"");
        if (cntval == '')
            continue;
        extra[select.value] = cntval;
    }
    if (!webval.startsWith('http://') && !webval.startsWith('https://') && webval != '')
        webval = 'https://'+webval;

    btn.disabled = true;
    profile_contacts_exec(nameval, webval, extra, profile_feedback(btn, 'cntfdbk'));
}

// workshop

var errmsg = 'Something went wrong. Refresh the page or try again later.'
function item_setresponse(txt, img, ext)
{
    var itresp = document.getElementById('itemresponse');
    if (txt != '')
    {
        if (img === undefined) img = app_root+'i/danger.svg';
        itresp.innerHTML = '<span class="delete" onclick="item_setresponse(\'\')">Close</span><img src="'+img+'"><div>'+txt+'</div>'+(ext !== undefined ? '<div>'+ext+'</div>' : '');
        itresp.scrollIntoView({behavior:"smooth",block:"nearest",inline:"nearest"});
    }
    else
        itresp.innerHTML = '';
}

function item_karma(cur)
{
    var extras = [
        "Eye for an eye, a tooth for a tooth",
        "Two wrongs don't make a right",
        "What goes around, comes around",
        "You are free to choose, but you are not free from the consequence of your choice",
        "How people treat you is their karma; how you react is yours",
        "A boomerang returns back to the person that throws it",
        "If you truly loved yourself, you could never hurt another",
    ];
    item_setresponse('You look at the karma wheel and ponder about the relation between its shape and your <a href="'+app_root+'karma-history">past deeds</a>.<br>"'+extras[Math.floor(Math.random()*extras.length)]+'," they say.<br><br>You sense your current <a href="'+app_root+'karma">karma</a> hovers around '+cur+'.', app_root+'item/karma-wheel.png');
}

function item_chest()
{
    if (buttons <= 0)
    {
        item_setresponse('You open your button chest and find nothing inside. Perhaps in time you will find some <a href="'+app_root+'buttons">buttons</a>.', app_root+'item/button-chest.png');
    }
    else
    {
        item_setresponse('You open your button chest and find '+buttons+' buttons inside.<br><br>Put <input id="btncnt" type="number" style="width:5em;text-align:right;" min="1" max="10000" value="1"> buttons into a bag. <input type="button" value="Do it!" onclick="item_makebag()">', app_root+'item/button-chest.png');
        document.getElementById('btncnt').focus();
    }
}

