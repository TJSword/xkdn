<template>
    <div class="wscn-http404-container">
        <div class="wscn-http404">
            <div class="pic-404">
                <img class="pic-404__parent" src="@/assets/images/404.png" alt="404" />
                <img class="pic-404__child left" src="@/assets/images/404_cloud.png" alt="404" />
                <img class="pic-404__child mid" src="@/assets/images/404_cloud.png" alt="404" />
                <img class="pic-404__child right" src="@/assets/images/404_cloud.png" alt="404" />
            </div>
            <div class="bullshit">
                <div class="bullshit__oops">404错误!</div>
                <div class="bullshit__headline">
                    {{ message }}
                </div>
                <div class="bullshit__info">
                    对不起，您正在寻找的页面不存在。尝试检查URL的错误，然后按浏览器上的刷新按钮或尝试在我们的应用程序中找到其他内容。
                </div>
                <router-link to="/" class="bullshit__return-home"> 返回首页 </router-link>
            </div>
        </div>
    </div>
</template>

<script setup>
let message = computed(() => {
    return '找不到网页！'
})
</script>

<style lang="scss" scoped>
.wscn-http404-container {
    transform: translate(-50%, -50%);
    position: absolute;
    top: 40%;
    left: 50%;
}

.wscn-http404 {
    display: flex;
    justify-content: space-between;
    overflow: hidden;

    .pic-404 {
        position: relative;
        float: left;
        overflow: hidden;
        width: vw(600);

        &__parent {
            width: 100%;
        }

        &__child {
            position: absolute;

            &.left {
                top: vh(17);
                left: vw(220);
                width: vw(80);
                opacity: 0;
                animation-name: cloud-left;
                animation-duration: 2s;
                animation-timing-function: linear;
                animation-fill-mode: forwards;
                animation-delay: 1s;
            }

            &.mid {
                top: vh(10);
                left: vw(420);
                width: vw(46);
                opacity: 0;
                animation-name: cloud-mid;
                animation-duration: 2s;
                animation-timing-function: linear;
                animation-fill-mode: forwards;
                animation-delay: 1.2s;
            }

            &.right {
                top: vh(100);
                left: vw(500);
                width: vw(62);
                opacity: 0;
                animation-name: cloud-right;
                animation-duration: 2s;
                animation-timing-function: linear;
                animation-fill-mode: forwards;
                animation-delay: 1s;
            }
            @keyframes cloud-left {
                0% {
                    top: vh(17);
                    left: vw(220);
                    opacity: 0;
                }

                20% {
                    top: vh(33);
                    left: vw(188);
                    opacity: 1;
                }

                80% {
                    top: vh(81);
                    left: vw(92);
                    opacity: 1;
                }

                100% {
                    top: vh(97);
                    left: vw(60);
                    opacity: 0;
                }
            }
            @keyframes cloud-mid {
                0% {
                    top: vh(10);
                    left: vw(420);
                    opacity: 0;
                }

                20% {
                    top: vh(40);
                    left: vw(360);
                    opacity: 1;
                }

                70% {
                    top: vh(130);
                    left: vw(180);
                    opacity: 1;
                }

                100% {
                    top: vh(160);
                    left: vw(120);
                    opacity: 0;
                }
            }
            @keyframes cloud-right {
                0% {
                    top: vh(100);
                    left: vw(500);
                    opacity: 0;
                }

                20% {
                    top: vh(120);
                    left: vw(460);
                    opacity: 1;
                }

                80% {
                    top: vh(180);
                    left: vw(340);
                    opacity: 1;
                }

                100% {
                    top: vh(200);
                    left: vw(300);
                    opacity: 0;
                }
            }
        }
    }

    .bullshit {
        position: relative;
        float: left;
        overflow: hidden;
        padding: vh(30) 0;
        width: vw(300);

        &__oops {
            margin-bottom: vh(20);
            font-size: vh(32);
            color: #1482f0;
            opacity: 0;
            font-weight: bold;
            line-height: vh(40);
            animation-name: slide-up;
            animation-duration: 0.5s;
            animation-fill-mode: forwards;
        }

        &__headline {
            margin-bottom: vh(10);
            font-size: vh(20);
            color: #222;
            opacity: 0;
            line-height: vh(24);
            font-weight: bold;
            animation-name: slide-up;
            animation-duration: 0.5s;
            animation-delay: 0.1s;
            animation-fill-mode: forwards;
        }

        &__info {
            margin-bottom: vh(30);
            font-size: vh(13);
            color: grey;
            opacity: 0;
            line-height: vh(21);
            animation-name: slide-up;
            animation-duration: 0.5s;
            animation-delay: 0.2s;
            animation-fill-mode: forwards;
        }

        &__return-home {
            display: block;
            float: left;
            width: vw(110);
            height: vh(36);
            font-size: vh(14);
            text-align: center;
            color: #fff;
            background: #1482f0;
            border-radius: vh(100);
            opacity: 0;
            line-height: vh(36);
            cursor: pointer;
            animation-name: slide-up;
            animation-duration: 0.5s;
            animation-delay: 0.3s;
            animation-fill-mode: forwards;
        }
        @keyframes slide-up {
            0% {
                transform: translateY(vh(60));
                opacity: 0;
            }

            100% {
                transform: translateY(0);
                opacity: 1;
            }
        }
    }
}
</style>
