
function account_login()
{
    var login = document.getElementById('acceml').value.replace(/^\s+|\s+$/g, '');
    var passw = document.getElementById('accpwd').value.replace(/^\s+|\s+$/g, '');
    document.getElementById('accbtn').disabled = true;
    post_request('user-ajax.php', 'action=login&email='+encodeURIComponent(login)+'&psswd='+encodeURIComponent(passw), function(status, response)
    {
        if (status == 200)
        {
            document.getElementById('accbtn').disabled = false;
            if (response == 'OK')
                window.location.reload(true);
            else if (response != '')
                alert(response);
        }
    });
}


// alerts

function alerts_toggle(cat, iid, elem)
{
    var cid = cat+'-'+iid;
    var alerts = get_cookie('alerts').split('|');
    var i = alerts.indexOf(cid);
    if (i > -1)
    {
        alerts.splice(i, 1);
        alerts_update(elem, false);
    }
    else
    {
        alerts.push(cid);
        alerts_update(elem, true);
    }
    set_cookie('alerts', alerts.join('|'));
}

function profile_about_exec(nickval, introval, genderval, donateval, feedback)
{
    set_cookie('nick', nickval);
    set_cookie('intro', introval);
    set_cookie('gender', genderval);
    window.location.reload(true);
}

function profile_contacts_exec(nameval, webval, extravals, feedback)
{
    set_cookie('name', nameval);
    set_cookie('web', webval);
    var i = 0;
    for (var key in extravals)
    {
        set_cookie('cnt'+i, key+':'+extravals[key]);
        ++i;
    }
    while (get_cookie('cnt'+i) != '')
    {
        set_cookie('cnt'+i);
        ++i;
    }
    feedback('OK');
}

// workshop

function item_buystock(id, price, ipar, where)
{
    document.getElementById(where).after(document.getElementById('itemresponse'));
    item_setresponse('Sorry pal, you do not seem to have enough <a href="'+app_root+'buttons">buttons</a>.');
}

function item_buy(id, price, from)
{
    alert('You do not have enough buttons.')
}

