/*
 * @(#)/openk.client.openk.js  0.9, 2015-09-02
 * 
 * OPEN KAKAO의 openkakao bbs (Front end) 환경을 위한 JavaScript
 *
 * @author  HJ
 * @version 1.0, 2015-09-02
 */
var openk = openk || {};
var fbase = new Firebase("https://openkakao.firebaseio.com/");
var fver = "v1_0";

$(function() {
    // For Cross Origin Issue
    // using jQuery
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    var csrftoken = getCookie('csrftoken');
    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }
    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
});

$(document).ready(function () {
    var domSelf = this;
    var queryString = openk.util.queryString();

    domSelf.page = (queryString && queryString.page && queryString.page < 11) ? parseInt(queryString.page) : 1;
    var $loading = openk.data.loading();

    $(".container .social a").tooltip();

    $(".openk-sort ul.nav-tabs li a").on("click", function(ev) {
        ev.preventDefault();
        domSelf.threads = {};

        if ($(this).parent().data('sort') == 'hot') {
            openk.util.notification("친구들을 위해 Facebook으로 공유해주시겠어요?", function() {
                FB.ui({
                  method: 'share',
                  href: 'http://chatkakao.com',
                }, function(response){});
            }, function() {});
        }

        var sort = ($(this).parent().data('sort') == 'hot') ? "totalCount" : "index";

        $(this).parent().parent().children("li").removeClass("active");
        $(this).parent().addClass("active");

        $(".pagination ul").empty();

        fbase.child(fver + "/threadCount/").once("value", function(cntSnap) {
            if ($loading) $loading.modal('hide');

            domSelf.threadCount = cntSnap.val();
            domSelf.pageCount = domSelf.pageCount || Math.ceil(domSelf.threadCount / 15);

            /* for (var i = 1; i <= domSelf.pageCount; i++) {
                var pageRev = Math.floor(domSelf.page / 10);
                var $liPage = '<li><a href="#" data-page="' + (i + pageRev * 10).toString() + '">' + (i + pageRev * 10).toString() + '</a></li>'
                $(".pagination ul").append($liPage);
            }

            if (domSelf.page == 1) {
                $(".pagination ul").append('<li><a href="#" data-page="next">Next</a></li>');
            } else if (domSelf.page == domSelf.pageCount) {
                $(".pagination ul").prepend('<li><a href="#" data-page="prev">Prev</a></li>');
            } else {
                $(".pagination ul").prepend('<li><a href="#" data-page="prev">Prev</a></li>');
                $(".pagination ul").append('<li><a href="#" data-page="next">Next</a></li>');
            } */

            $(".openk-contents").empty();

            fbase.child(fver + "/threads/").orderByChild(sort).limitToFirst(750).on("child_added", function(snap, prevChildKey) {
                domSelf.prevChildKey = prevChildKey;
                domSelf.render(snap.key(), snap.val());

                /* $('.pagination ul li a').on('click', function(ev) {
                    ev.preventDefault();
                    $(".openk-contents").empty();

                    if ($(this).data('page') == 'next') domSelf.page = domSelf.page + 1;
                    else domSelf.page = domSelf.page - 1;

                    fbase.child(fver + "/threads/").orderByChild(sort).startAt(domSelf.prevChildKey).limitToFirst(15).on("child_added", function(snap, prevChildKey) {

                    });
                }); */
            });
        });

    });

    domSelf.render = function(key, val) {
        domSelf.idx = domSelf.idx || 0;
        var threadKey = key;
        var $thread = val;

        if (domSelf.idx % 3 == 0) $('.openk-contents').append('<div class="row post_row"></div>');

        var $post = $('<div class="span4 post"></div>');
        if (domSelf.idx % 3 == 2) $post.addClass("last");

        var $postContent = $('<div class="text">' +
            '<h5><a data-key="' + threadKey + '" data-url="' + $thread.URL + '" href="#">' + $thread.subject + '</a></h5>' +
            '<span class="date">' + (-1 * $thread.totalCount) + ' Clicks</span>' +
            '<p>' + $thread.description + '</p></div>' +
            '<div class="author_box"><h6><a data-key="' + threadKey + '" data-url="' + $thread.URL + '" href="#">' + $thread.URL + '</a></h6></div>' +
            '<a class="plus_wrapper text-right" data-key="' + threadKey + '" data-url="' + $thread.URL + '" href="#" style="margin-top:2em; background-color:#e0e0e0;">' +
            '<span>채팅 열기</span></a>');
        $post.append($postContent);

        $('.openk-contents .post_row:last-child').append($post);

        domSelf.idx++;

        $('.openk-contents .post_row a').off("click");
        $('.openk-contents .post_row a').on("click", function(ev) {
            ev.preventDefault();

            var okUrl = $(this).data('url');
            var $target = fbase.child(fver + "/threads/" + $(this).data("key"));
            $target.child("dailyCount").transaction(function(currentSnap) {
                return currentSnap - 1;
            });
            $target.child("weeklyCount").transaction(function(currentSnap) {
                return currentSnap - 1;
            });
            $target.child("totalCount").transaction(function(currentSnap) {
                return currentSnap - 1;
            }, function(err, committed, cntSnap) {
                openk.util.notification("친구들을 위해 Facebook으로 공유해주시겠어요?", function() {
                    FB.ui({
                      method: 'share',
                      href: 'http://chatkakao.com',
                    }, function(response){
                        location.href = okUrl;
                    });
                }, function() {
                    location.href = okUrl;
                });
            });
        });
    };

    $('input#add_subject').keypress(function(ev) {
        if (ev.which == 13) $('input#add_url').focus();
    });

    $('input#add_url').keypress(function(ev) {
        if (ev.which == 13) $('input#add_description').focus();
    });

    $('input#add_url').focusout(function() {
        if ($(this).val().indexOf('http://open.kakao.com') < 0) {
            $("#error_message").text('올바른 OPEN KAKAO URL을 입력해 주세요');
        }
    });

    $('input#add_description').keypress(function(ev) {
        if (ev.which == 13) $(this).parent().parent().children('button').trigger("click");
    });

    $('#footer .credits .social .facebook').on('click', function(ev) {
        ev.preventDefault()
        FB.ui({
          method: 'share',
          href: 'http://chatkakao.com',
        }, function(response) {});
    });

    $('.submit-box .form button').on("click", function() {
        var subject = $('input#add_subject').val();
        var url = $('input#add_url').val();
        var description = $('input#add_description').val();

        if (subject == "" || subject == null) {
            $('#error_message').text('제목을 입력해 주세요');
        } else if (url == "" || url == null || url.indexOf('http://open.kakao.com') < 0) {
            $('#error_message').text('올바른 OPEN KAKAO URL을 입력해 주세요');
        } else {
            $('#error_message').text('');

            fbase.child(fver + "/threadCount/").once("value", function(countSnap) {
                var threadCount = countSnap.val();
                var $target = fbase.child(fver + "/threads/");
                var $thread = {
                    "index": (-1 * (countSnap.val() + 1))
                    , "subject": subject
                    , "URL": url
                    , "description": description
                    , "inDate": (Firebase.ServerValue.TIMESTAMP)
                    , "dailyCount": 0
                    , "weeklyCount": 0
                    , "totalCount": 0
                };

                $target.setPriority(Firebase.ServerValue.TIMESTAMP);
                $target.push($thread);
                fbase.child(fver + "/threadCount/").transaction(function(currentCount) {
                    return currentCount + 1;
                });

                $('input#add_subject').val('');
                $('input#add_url').val('');
                $('input#add_description').val('');
                openk.util.notification("추가되었습니다", function() {
                    location.reload();
                });
            });
        }

        $(this).parent().children('input[type="text"]').val("");
    });

    $(function() {
        $('.openk-sort ul.nav-tabs li[data-sort="new"] a').trigger("click");
    });
});
